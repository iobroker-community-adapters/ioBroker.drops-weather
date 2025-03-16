![Logo](admin/drops-weather.png)

# ioBroker.drops-weather

[![NPM version](https://img.shields.io/npm/v/iobroker.drops-weather.svg)](https://www.npmjs.com/package/iobroker.drops-weather)
[![Downloads](https://img.shields.io/npm/dm/iobroker.drops-weather.svg)](https://www.npmjs.com/package/iobroker.drops-weather)
![Number of Installations](https://iobroker.live/badges/drops-weather-installed.svg)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/iobroker.drops-weather?label=npm%20dependencies&style=flat-square)

![GitHub](https://img.shields.io/github/license/inbux/iobroker.drops-weather?style=flat-square)
![Test and Release](https://github.com/inbux/ioBroker.drops-weather/workflows/Test%20and%20Release/badge.svg)

<!-- ![Current version in stable repository](https://iobroker.live/badges/drops-weather-stable.svg) -->
<!-- [![NPM](https://nodei.co/npm/iobroker.drops-weather.png?downloads=true)](https://nodei.co/npm/iobroker.drops-weather/) -->

## drops-weather adapter for ioBroker

Reading rain data from https://www.drops.live

## Features

This adapter reads the rain data in an interval of 5 minutes from the website.
There is a chart datapoint, which can directly be used by the BarChart widget from the Material Designs widgets.
![Logo](img/ChartDrops2.png)

The 5 minutes and 1h data is stored in different states.
![Logo](img/statesDrops.png)

## Configuration

GPS position is not longer available on the drops.live website.

You know need a city code of your location or city. To get this code, just enter your city name (or use your location) at https://www.drops.live .

You will find your city code in the URL:

![Logo](img/citycode.png)

In this example you will find 6573 for Berlin.

## Changelog

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**
-   (arteck) switch from axios to puppeteer

### 0.3.1 (2024-02-05)

- (inbux)

### 0.3.0 (2024-02-05)

breaking changes in drops.live homepage (2024-02-05)

-   (inbux) parsing of drops.live homepage updated
-   (inbux) GPS position is not longer supported on the website, added city code in configuration
-   (inbux) removed temperture because this data is not longer available
-   (inbux) updated readme

### 0.2.3 (2024-01-17)

-   (inbux) updated dependencies

### 0.2.2 (2024-01-17)

-   (inbux) changed URL from drops.live to www.drops.live (thanks to Marc-Berg)
-   (inbux) small changes because of axios update
-   (inbux) changed units to mm/h

### 0.2.1 (2022-10-02)

-   (inbux) added actualRain
-   (inbux) reading system language for weekdays localization
-   (inbux) changed rainStartsAt to timestamp
-   (inbux) changed most log messages to debug to keep log cleaner
-   (inbux) updated README.md

### 0.2.0 (2022-10-01)

-   (inbux) added use of system configuration for gps coordinates
-   (inbux) axios timeout increased
-   (inbux) changed some logs from error to warn
-   (inbux) added some more error handling and log messages
-   (inbux) fixed problem with city containing umlauts

### 0.1.1 (2022-09-30)

-   (inbux)

### 0.1.0 (2022-09-30)

-   (inbux)

### v0.0.1 (2022-09-30)

-   (inbux) initial release

## License

MIT License

Copyright (c) 2024 inbux <inbux.development@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
