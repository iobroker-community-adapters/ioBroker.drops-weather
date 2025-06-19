# Older Changelogs
## 1.2.0 (2025-03-24)
- (mcm1957) Timeout has been encreased to 15s.
- (mcm1957) Logging has been reduced.
- (arteck) Adapter has been converted to scheduled operation. 
- (mcm1957) A spelling error blocking chromium-browser manual selection has been corrected.

## 1.1.0 (2025-03-19)
- (mcm1957) support for raspberryPi / arm architecture added
- (mcm1957) adminUI extended to allow browser selection
- (mcm1957) dependencies have been updated

## 1.0.0 (2025-03-17)
- (mcm1957) adapter has been migrated to iobroker-community-adapters organisation
- (mcm1957) adapter requires node.js 20.x, js-controller 6 and admin 7 now.
- (arteck) axios has been replaced by puppeteer
- (mcm1957) dependencies have been updated

## 0.3.0 (2024-02-05)

- (inbux) breaking changes in drops.live homepage (2024-02-05)

- (inbux) parsing of drops.live homepage updated
- (inbux) GPS position is not longer supported on the website, added city code in configuration
- (inbux) removed temperture because this data is not longer available
- (inbux) updated readme

## 0.2.3 (2024-01-17)
- (inbux) updated dependencies

## 0.2.2 (2024-01-17)
- (inbux) changed URL from drops.live to www.drops.live (thanks to Marc-Berg)
- (inbux) small changes because of axios update
- (inbux) changed units to mm/h

## 0.2.1 (2022-10-02)
- (inbux) added actualRain
- (inbux) reading system language for weekdays localization
- (inbux) changed rainStartsAt to timestamp
- (inbux) changed most log messages to debug to keep log cleaner
- (inbux) updated README.md

## 0.2.0 (2022-10-01)
- (inbux) added use of system configuration for gps coordinates
- (inbux) axios timeout increased
- (inbux) changed some logs from error to warn
- (inbux) added some more error handling and log messages
- (inbux) fixed problem with city containing umlauts

## v0.0.1 (2022-09-30)
- (inbux) initial release