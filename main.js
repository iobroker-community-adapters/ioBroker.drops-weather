'use strict';
const dayjs = require('dayjs');
require('dayjs/locale/de');
const puppeteer = require('puppeteer');

let interval = null;
let starttimeout;


const utils = require('@iobroker/adapter-core');


class DropsWeather extends utils.Adapter {
    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    constructor(options) {
        super({
            ...options,
            name: 'drops-weather',
        });

        this.baseUrl = 'https://www.meteox.com/en-gb/city/';

        this.dropsCall;

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    //----------------------------------------------------------------------------------------------------
    /**
	 * Is called when databases are connected and adapter received configuration.
	 */
    async onReady() {

        await this.getLanguage();

        starttimeout = setTimeout(() => {
            if (this.config.citycode === null || this.config.citycode === '') {
                this.log.error(`City code not set - please check instance configuration of ${this.namespace}`);
            } else {
                this.readDataFromServer();
            }
        }, 2000);

        interval = setInterval(() => {
            if (this.config.citycode === null || this.config.citycode === '') {
                clearInterval(interval);
            } else {
                this.readDataFromServer();
            }
        }, 5 * 60 * 1000);
    }

    //----------------------------------------------------------------------------------------------------
    async getLanguage() {
        try {
            this.log.debug('getting system language');
            this.getForeignObject('system.config', (err, state) => {
                if (err || state === undefined || state === null || state.common.language === '') {
                    this.log.warn(`no language set in system configuration of ioBroker set to EN`);
                    dayjs.locale('en');
                } else {
                    this.log.debug(state.common.language);
                    if (state.common.language === 'de') {
                        dayjs.locale('de');
                        this.baseUrl = 'https://www.meteox.com/de-de/city/';
                    }
                    else {
                        dayjs.locale('en');
                    }
                }
            });
        } catch (error) {
            this.log.warn(error);
        }
    }
    //----------------------------------------------------------------------------------------------------
    async readDataFromServer() {
        try {
            const url = this.baseUrl + this.config.citycode;

            this.log.debug('Reading data from : ' + url);

            let weatherdataFound = false;

            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            await page.goto(url, {
                waitUntil: 'domcontentloaded', // Warten, bis die Seite fertig geladen ist
            });

            const scriptContents = await page.evaluate(() => {
                // @ts-ignore
                const scripts = document.querySelectorAll('script'); // ja das ist korrekt so
                for (const script of scripts) {
                    if (script.textContent.includes('RainGraph.create({')) {
                        return script.textContent.split('\n');
                    }
                }
                return null;
            });

            /*
			$('.text-sm.bg-sub-menu-bg.py-1.px-2.w-full.rounded-lg.leading-6').each((_, e) => {
				const row = $(e).text();
				this.log.debug(row);
				this.setStateAsync('data_1h.labeltext', { val: row, ack: true });
			});
*/


            for (const scriptContent of scriptContents) {
                if (scriptContent.includes('series')) {
                    console.log('weatherData found');
                    let data = scriptContent.substring(scriptContent.indexOf('series'));

                    if (data.includes('}}},')) {
                        weatherdataFound = true;
                        data = data.substring(7, data.indexOf('}}},') + 3);
                        data = data.replace('2h', 'data2h');
                        data = data.replace('24h', 'data24h');

                        const dataJSON = JSON.parse(data);
                        console.log('creating 5 min states');
                        this.createStateData(dataJSON.data2h.data, 'data_5min');

                        console.log('creating 1 hour states');
                        this.createStateData(dataJSON.data24h.data, 'data_1h');
                    } else {
                        console.log('end of data in series NOT found');
                    }
                }
            }
            await browser.close();

            if (!weatherdataFound) {
                this.log.warn('no weatherData found in HTML');
            }
        } catch (error) {
            this.log.warn(error);
        }
    }

    splitByNewline(inputString) {
        return inputString.split('\n');
    }

    //----------------------------------------------------------------------------------------------------
    async createStateData(data, channel) {
        try {
            let JSONdata_rain = [];
            let raindata = [];
            let isRainingNow = false;
            let rainStartsAt = '-1';
            let rainStartAmount = 0;
            let dateformat = 'HH:mm';

            if (channel == 'data_1h') dateformat = 'dd HH:mm';
            //	this.log.info(JSON.stringify(data));

            if (data[0].precipitationrate > 0) isRainingNow = true;
            this.setStateAsync(channel + '.isRainingNow', { val: isRainingNow, ack: true });

            await this.setStateAsync(channel + '.timestamp', { val: data[0].time, ack: true });
            await this.setStateAsync(channel + '.actualRain', { val: data[0].precipitationrate, ack: true });

            for (const i in data) {
                raindata.push(data[i].precipitationrate);

                const item_rain = {};

                const date = dayjs(data[i].time);

                if (rainStartsAt == '-1')
                    if (data[i].precipitationrate > 0) {
                        rainStartsAt = date.format('YYYY-MM-DDTHH:mm:ssZ');
                        rainStartAmount = data[i].c;
                    }
                //this.log.debug(date.format('HH:mm').toString());

                item_rain['label'] = date.format(dateformat).toString();
                item_rain['value'] = data[i].precipitationrate.toString();
                JSONdata_rain.push(item_rain);
            }
            JSONdata_rain = JSON.parse(JSON.stringify(JSONdata_rain));

            raindata = JSON.parse(JSON.stringify(raindata));

            this.log.debug(`Rain (${channel}): ` + JSON.stringify(JSONdata_rain));

            await this.setStateAsync(channel + '.chartRain', { val: JSON.stringify(JSONdata_rain), ack: true });
            await this.setStateAsync(channel + '.raindata', { val: JSON.stringify(raindata), ack: true });
            await this.setStateAsync(channel + '.rainStartsAt', { val: rainStartsAt, ack: true });
            await this.setStateAsync(channel + '.startRain', { val: rainStartAmount, ack: true });
        } catch (error) {
            this.log.error(error);
        }
    }
    //----------------------------------------------------------------------------------------------------
    /**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
    onUnload(callback) {
        try {
            clearInterval(interval);
            clearTimeout(starttimeout);
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    module.exports = (options) => new DropsWeather(options);
} else {
    // otherwise start the instance directly
    new DropsWeather();
}
