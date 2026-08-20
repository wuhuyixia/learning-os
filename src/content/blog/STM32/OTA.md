---
title: OTA
description: MCU 通过无线连接（BLE / Wi‑Fi）从云端服务器获取固件更新，Bootloader 校验并写入 Flash，完成远程升级
pubDate: 2025-12-26
updated: 2026-08-14
image: /image/STM32/OTA.png
categories:
  - 物联网
tags:
  - 物联网
---

# Flash结构

# Flash的读写

![RMW机制](/learning-os/image/STM32/OTA1.png)

# Ymodem协议

YMODEM 是一种基于块传输的串口文件传输协议，使用 1K 数据块和 CRC16 校验来提高速度与可靠性，并通过块 0 发送文件名与大小实现多文件传输，常用于嵌入式设备的固件升级。

<div class="protocol-card not-prose">

  <div class="protocol-title">YMODEM 数据包结构:</div>

  <div class="protocol-flow">
    <span class="sig blue">数据包开始信号 SOH/STX</span>
    <span class="sig gray">1 Byte</span>

    <span class="sig blue">发送序号</span>
    <span class="sig gray">1 Byte</span>

    <span class="sig blue">发送序号反码</span>
    <span class="sig gray">1 Byte</span>

    <span class="sig blue">数据区</span>
    <span class="sig gray">128 / 1024 Byte</span>

    <span class="sig blue">CRC 高字节</span>
    <span class="sig gray">1 Byte</span>

    <span class="sig blue">CRC 低字节</span>
    <span class="sig gray">1 Byte</span>
  </div>

</div>

## Ymodem协议全景解析

![文件传输会话](/learning-os/image/STM32/OTA2.png)


# onenet平台设置

登录[onenet平台](https://iot.10086.cn/)进行注册→控制台→设备管理服务

产品开发→创建产品→选择其他行业，自定义功能

可选择设备接入（不能使用中移和物app控制，需自己开发UI，灵活性高），产品智能化（可以使用中移和物app控制）

产品名称，所属地市随便填写，开发方案选自定义方案，自己定义需要的功能，我是使用esp32c3通过wifi连接的所以这里选直连设备wifi，网关是帮助子设备进行通信的中间桥梁，子设备是没有联网功能，不能直接进行网络通信如ZigBee，蓝牙，LoRa得通过网关进行通信，可根据自己的连接方式自行选择。

进入产品开发

设置物模型。这里是官方对物模型的描述物模型，总的来说就是物联网设备的说明书，告诉云平台，这个设备是什么，能干什么，怎么控制它，根据这些将物模型分为三类基础功能：属性，服务，事件。举一个ws2812全彩灯的例子，属性就是RGB红绿蓝颜色（0-255）值，服务就是设置灯的颜色，事件就是如果设备设置颜色失败时触发。
~~~
添加自定义功能，这里还是以上面的ws2812设置属性为例，设置了两个功能分别为RBG亮度和开关，

功能选择属性设置，功能名称开关，标识符要记住一会要用，数据类型这里选择了布尔类型，读写类型为可读可写。功能选择属性设置。

功能名称RGB灯，标识符要记住一会要用，数据类型这里选择了结构体，选择结构体是因为结构体获取到数据解析时和其他数据有所不同。
~~~



![添加自定义功能点](/learning-os/image/STM32/OTA/OTA.png)

![添加自定义功能点](/learning-os/image/STM32/OTA/OTA1.png)

选择设备开发基于模组开发，然后随便选一个即可，然后就可以扫描下载中移和物app了。注意如果前面选择设备接入就不会有这个界面，直接跳到 5 添加设备

选择交互配置，选择开启中移和物app控制，下面是设置app的配置，可根据官方文档交互配置自行配置


左侧栏设备接入管理，设备管理。添加设备。所属产品选择刚刚创建的产品，名称随便起


# 连接云平台

使用的是合宙的esp32-c3

## 验证板载LED
~~~
#include <stdio.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "driver/gpio.h"
#include "esp_log.h"

#define LED_GPIO GPIO_NUM_13

static const char *TAG = "LED_TEST";

void app_main(void)
{
    ESP_LOGI(TAG, "ESP32-C3 LED test start");

    /* 将 GPIO13 配置为输出 */
    gpio_reset_pin(LED_GPIO);

    gpio_set_direction(
        LED_GPIO,
        GPIO_MODE_OUTPUT
    );

    while (1)
    {
        /* LED 点亮 */
        gpio_set_level(LED_GPIO, 1);

        ESP_LOGI(TAG, "LED ON");

        vTaskDelay(
            pdMS_TO_TICKS(1000)
        );

        /* LED 熄灭 */
        gpio_set_level(LED_GPIO, 0);

        ESP_LOGI(TAG, "LED OFF");

        vTaskDelay(
            pdMS_TO_TICKS(1000)
        );
    }
}
~~~

## wifi连接
~~~
#include <stdio.h>
#include <string.h>

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "nvs_flash.h"


/* ==============================
 * WiFi 配置
 * ============================== */

/* 修改成你自己的 WiFi */
#define WIFI_SSID       "你的WiFi名称"
#define WIFI_PASSWORD   "你的WiFi密码"

/* 最大重连次数 */
#define WIFI_MAX_RETRY  5


/* ==============================
 * EventGroup 标志位
 * ============================== */

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1


static EventGroupHandle_t wifi_event_group;

static const char *TAG = "WIFI_TEST";

static int retry_num = 0;


/* ==============================
 * WiFi / IP 事件处理函数
 * ============================== */

static void wifi_event_handler(void *arg,
                               esp_event_base_t event_base,
                               int32_t event_id,
                               void *event_data)
{
    /* WiFi STA 启动完成 */
    if (event_base == WIFI_EVENT &&
        event_id == WIFI_EVENT_STA_START)
    {
        ESP_LOGI(TAG, "WiFi STA started");

        /* 开始连接路由器 */
        esp_wifi_connect();
    }

    /* WiFi 断开 */
    else if (event_base == WIFI_EVENT &&
             event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        if (retry_num < WIFI_MAX_RETRY)
        {
            ESP_LOGW(TAG,
                     "WiFi disconnected, retrying... (%d/%d)",
                     retry_num + 1,
                     WIFI_MAX_RETRY);

            esp_wifi_connect();

            retry_num++;
        }
        else
        {
            ESP_LOGE(TAG,
                     "Failed to connect to WiFi");

            xEventGroupSetBits(
                wifi_event_group,
                WIFI_FAIL_BIT
            );
        }
    }

    /* 成功获取 IP */
    else if (event_base == IP_EVENT &&
             event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event =
            (ip_event_got_ip_t *)event_data;

        ESP_LOGI(TAG, "");
        ESP_LOGI(TAG, "==============================");
        ESP_LOGI(TAG, "WiFi connected successfully!");
        ESP_LOGI(TAG,
                 "IP address: " IPSTR,
                 IP2STR(&event->ip_info.ip));

        ESP_LOGI(TAG,
                 "Gateway   : " IPSTR,
                 IP2STR(&event->ip_info.gw));

        ESP_LOGI(TAG,
                 "Netmask   : " IPSTR,
                 IP2STR(&event->ip_info.netmask));

        ESP_LOGI(TAG, "==============================");

        retry_num = 0;

        xEventGroupSetBits(
            wifi_event_group,
            WIFI_CONNECTED_BIT
        );
    }
}


/* ==============================
 * WiFi STA 初始化
 * ============================== */

static void wifi_init_sta(void)
{
    ESP_LOGI(TAG, "Initializing WiFi...");


    /* 1. 创建 EventGroup */
    wifi_event_group = xEventGroupCreate();


    /* 2. 初始化 TCP/IP 网络接口 */
    ESP_ERROR_CHECK(
        esp_netif_init()
    );


    /* 3. 创建默认事件循环 */
    ESP_ERROR_CHECK(
        esp_event_loop_create_default()
    );


    /* 4. 创建默认 WiFi STA 网络接口 */
    esp_netif_create_default_wifi_sta();


    /* 5. 初始化 WiFi 驱动 */
    wifi_init_config_t cfg =
        WIFI_INIT_CONFIG_DEFAULT();

    ESP_ERROR_CHECK(
        esp_wifi_init(&cfg)
    );


    /* 6. 注册 WiFi 事件 */
    ESP_ERROR_CHECK(
        esp_event_handler_instance_register(
            WIFI_EVENT,
            ESP_EVENT_ANY_ID,
            &wifi_event_handler,
            NULL,
            NULL
        )
    );


    /* 7. 注册 IP 获取事件 */
    ESP_ERROR_CHECK(
        esp_event_handler_instance_register(
            IP_EVENT,
            IP_EVENT_STA_GOT_IP,
            &wifi_event_handler,
            NULL,
            NULL
        )
    );


    /* 8. WiFi 参数 */
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
        },
    };


    /* 9. 设置为 Station 模式 */
    ESP_ERROR_CHECK(
        esp_wifi_set_mode(WIFI_MODE_STA)
    );


    /* 10. 设置 STA 参数 */
    ESP_ERROR_CHECK(
        esp_wifi_set_config(
            WIFI_IF_STA,
            &wifi_config
        )
    );


    /* 11. 启动 WiFi */
    ESP_ERROR_CHECK(
        esp_wifi_start()
    );


    ESP_LOGI(TAG, "WiFi initialization finished");
    ESP_LOGI(TAG, "Connecting to: %s", WIFI_SSID);


    /* 等待连接结果 */
    EventBits_t bits =
        xEventGroupWaitBits(
            wifi_event_group,
            WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
            pdFALSE,
            pdFALSE,
            portMAX_DELAY
        );


    if (bits & WIFI_CONNECTED_BIT)
    {
        ESP_LOGI(TAG,
                 "Connected to WiFi: %s",
                 WIFI_SSID);
    }
    else if (bits & WIFI_FAIL_BIT)
    {
        ESP_LOGE(TAG,
                 "Unable to connect to WiFi: %s",
                 WIFI_SSID);
    }
}


/* ==============================
 * main
 * ============================== */

void app_main(void)
{
    ESP_LOGI(TAG, "");
    ESP_LOGI(TAG, "==============================");
    ESP_LOGI(TAG, "ESP32-C3 WiFi Test");
    ESP_LOGI(TAG, "==============================");


    /* ==========================
     * 初始化 NVS
     * ========================== */

    esp_err_t ret =
        nvs_flash_init();


    /*
     * 如果 NVS 分区异常，
     * 擦除后重新初始化。
     */
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES ||
        ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_LOGW(TAG,
                 "Erasing NVS flash...");

        ESP_ERROR_CHECK(
            nvs_flash_erase()
        );

        ret =
            nvs_flash_init();
    }


    ESP_ERROR_CHECK(ret);

    ESP_LOGI(TAG,
             "NVS initialized successfully");


    /* ==========================
     * 初始化并连接 WiFi
     * ========================== */

    wifi_init_sta();


    /* 到这里说明连接过程已经结束 */

    ESP_LOGI(TAG,
             "WiFi test finished");
}
~~~

##  OneNET MQTT连接

[MQTTX下载](https://mqttx.app/zh/downloads)

## 连接onenet的3大参数
- username：产品ID
- clientid：设备名称
- 连接onenet时密码（[Token](https://open.iot.10086.cn/doc/aiot/fuse/detail/1486)）

![产品ID](/learning-os/image/STM32/OTA/OTA2.png)

![设备名称](/learning-os/image/STM32/OTA/OTA3.png)

Token的组成

- version：参数组版本号，固定为2026-8-18
- res：可根据规则自行选择，我是选择的一机一密
- et：访问过期时间的时间戳，参数中的et要大于当前的时间，如1785642483为2026-08-02 11:48:03
- method：加密算法支持hmac-md5，hmac-sha1，hmac-sha256

获取Token

分为两种官方工具生成和代码生成，官方工具生成，可以快速获取Token，操作简单，但生成的Token是固定的，代码实现灵活性更高，而且可根据系统时间设置过期时间时间戳，后期更好维护。我后面选择的代码生成。

1.通过[官方工具](https://open.iot.10086.cn/doc/aiot/fuse/detail/1487)直接生成

![Token生成工具](/learning-os/image/STM32/OTA/OTA4.png)


- 产品级鉴权时，res字段为products/{产品id}，key为产品级key
- 设备级鉴权时，res字段为products/{产品id}/devices/{设备名}，key为设备级key
- et: [在线时间戳](https://www.jyshare.com/front-end/852/)

打开后按照前面所讲的参数填入即可，这个key如果前面res选择一型一密就是产品密钥，如果选择一机一密就是设备密钥，最后点击Generate就可直接生成。这就是mqtt连接时使用的密码

2.[代码生成](https://open.iot.10086.cn/doc/aiot/fuse/detail/1486)

###  MQTTX连接onenet
为什么要用MQTTX连接onenet，不直接使用代码。

因为这样可以方便后面排除问题是消息的格式错了，还是连接有问题。知道上报消息的结构，方便写JSON代码。当然也可以直接看官方的例程写代码，这是链接[文档中心](https://iot.10086.cn/doc/aiot/fuse/detail/922)。

>在设置中切换中文

![MQTTX配置](/learning-os/image/STM32/OTA/OTA5.png)

- 服务器地址：mqtt://mqtts.heclouds.com，地址在[文档中心](https://iot.10086.cn/doc/aiot/fuse/detail/919)
- 端口：1883
- Client ID：设备名称
- 用户名：产品ID
- 密码：Token
- MQTT版本：3.1.1，onenet目前只支持3.1.1

![MQTTX连接](/learning-os/image/STM32/OTA/OTA6.png)

![设备在线](/learning-os/image/STM32/OTA/OTA7.png)

## onenet的mqtt[通信主题](https://open.iot.10086.cn/doc/aiot/fuse/detail/920)


### 属性相关主题
| 功能 | 主题 | 操作权限 |
|---|---|---|
| 设备属性上报请求 | `$sys/{pid}/{device-name}/thing/property/post` | 发布 |
| 设备属性上报响应 | `$sys/{pid}/{device-name}/thing/property/post/reply` | 订阅 |
| 设备属性设置请求 | `$sys/{pid}/{device-name}/thing/property/set` | 订阅 |
| 设备属性设置响应 | `$sys/{pid}/{device-name}/thing/property/set_reply` | 发布 |

### OTA升级相关主题
| 功能 | 主题 | 操作权限 |
|---|---|---|
| 系统OTA升级通知 | `$sys/{pid}/{device-name}/ota/inform` | 订阅 |
| 设备回复系统OTA升级通知 | `$sys/{pid}/{device-name}/ota/inform_reply` | 发布 |

- pid：产品ID
- device-name：设备名称

首先订阅“设备属性上报响应”的主题

- Topic：就是上面设备属性上报响应的主题
- QoS：QoS 0消息仅发送一次，无确认机制，可能丢失。
- QoS 1消息可能发送多次，确保消息至少送达一次，可能重复。
- QoS 2 onenet目前不支持QoS 2。

然后启动调试

![属性上报](/learning-os/image/STM32/OTA/OTA8.png)

![上报接受](/learning-os/image/STM32/OTA/OTA8.png)

```
{
	"id": "123",
	"version": "1.0",
	"params": {
		"RGB_Light": {
			"value": {
        "red": 55,
        "green": 66,
        "blue": 77
        }
		},
		"Switch": {
			"value": true
		}
	}
}
```
#### 设备属性设置

添加设备属性上报响应订阅，在onenet设备开关（Switch） bool进行属性设置，mqttx上接受到


![收到属性设置](/learning-os/image/STM32/OTA/OTA10.png)

