'use strict';

const utils = require('@iobroker/adapter-core');
const os = require('node:os');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// add the stealth plugin
puppeteer.use(StealthPlugin());

let watchdog = null;
let browser = null;

class DropsWeather extends utils.Adapter {
    /**
     * @param options ioBroker optionen
     */
    constructor(options) {
        super({
            ...options,
            name: 'drops-weather',
        });

        this.mainURLEN = 'https://www.meteox.com/';
        this.mainURLDE = 'https://www.niederschlagsradar.de/';
        this.pageTimeout = 60000;

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    //----------------------------------------------------------------------------------------------------
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        if (!this.config.browserMode) {
            this.config.browserMode = 'automatic';
        }
        this.log.debug(`browserMode set to ${this.config.browserMode}, running on ${os.platform} / ${os.arch}`);
        this.chromeExecutable = undefined;

        if (this.config.browserMode === 'built-in') {
            if (os.arch() === 'arm') {
                this.log.error(
                    `browser mode ${this.config.browserMode} not supported on platform ${os.platform()} / ${os.arch()}`,
                );
                this.disable();
                this.terminate();
                return;
            }
        } else if (this.config.browserMode === 'chromium-browser') {
            if (os.platform() !== 'linux' || os.arch() !== 'arm') {
                this.log.error(
                    `browser mode ${this.config.browserMode} not supported on platform ${os.platform()} / ${os.arch()}`,
                );
                this.disable();
                this.terminate();
                return;
            }
            this.chromeExecutable = '/usr/bin/chromium-browser';
        } else if (this.config.browserMode === 'external') {
            this.chromeExecutable = this.config.browserPath;
        } else if (this.config.browserMode === 'automatic') {
            if (os.platform() === 'linux' && os.arch() === 'arm') {
                this.chromeExecutable = '/usr/bin/chromium-browser';
            }
        } else {
            this.log.error(
                `browser mode ${this.config.browserMode} not (yet) supported, running on ${os.platform} / ${os.arch}`,
            );
            this.disable();
            this.terminate();
            return;
        }

        this.log.debug(`browserPath set to ${this.chromeExecutable ? this.chromeExecutable : 'puppeteer default'}`);

        if (this.config.citycode === null || this.config.citycode === '') {
            this.log.error(`City code not set - please check instance configuration of ${this.namespace}`);
        } else {
            this.readDataFromServer();
        }
    }

    //----------------------------------------------------------------------------------------------------
    async readDataFromServer() {
        let mainURL = this.mainURLDE;

        if (this.config.language == 'en') {
            mainURL = this.mainURLEN;
        }
        const url = `${mainURL}${this.config.language}/city/${this.config.citycode}`;

        watchdog = this.setTimeout(() => {
            this.log.error('timeout connecting to brower ${this.chromeExecutable}');
            this.disable();
            this.terminate();
        }, 10000);

        const puppeteerLaunchCfg = {
            headless: true,
            defaultViewport: null,
            executablePath: this.chromeExecutable,
            userDataDir: '/dev/null',
            args: [
                '--periodic-task',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--ignore-certificate-errors',
                '--disable-extensions',
                '--disable-component-extensions-with-background-pages',
                '--disable-default-apps',
                '--mute-audio',
                '--no-default-browser-check',
                '--autoplay-policy=user-gesture-required',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-notifications',
                '--disable-background-networking',
                '--disable-breakpad',
                '--disable-component-update',
                '--disable-domain-reliability',
                '--disable-sync',
            ],
        };

        if (this.chromeExecutable) {
            puppeteerLaunchCfg[puppeteer.executablePath] = this.chromeExecutable;
        }

        this.log.debug(`puppeteer.lauch invoked with ${JSON.stringify(puppeteerLaunchCfg)}`);

        try {
            browser = await puppeteer.launch(puppeteerLaunchCfg);

            this.clearTimeout(watchdog);
            watchdog = null;
        } catch (e) {
            this.log.error(`error launching browser ${this.chromeExecutable} - ${e}`);
            this.disable();
            this.terminate();
            return;
        }

        this.log.debug(`Reading data from : ${url}`);

        let weatherdataFound = false;

        this.log.debug(`creating new page ...`);
        try {
            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            );

            await page.goto(url, {
                waitUntil: 'networkidle0', // Warten, bis die Seite fertig geladen ist
            });

            await page.waitForFunction(
                () => {
                    // @ts-expect-error document seems to be defined by puppeteer
                    // eslint-disable-next-line no-undef
                    return [...document.querySelectorAll('script')].some(script =>
                        script.textContent.includes('RainGraph.create({'),
                    );
                },
                { timeout: this.pageTimeout },
            );

            this.log.debug(`domcontent loaded, evaluate page`);
            const scriptContents = await page.evaluate(() => {
                // @ts-expect-error document seems to be defined by puppeteer
                // eslint-disable-next-line no-undef
                const scripts = document.querySelectorAll('script'); // ja das ist korrekt so
                for (let script of scripts) {
                    if (script.textContent.includes('RainGraph.create({')) {
                        return script.textContent.split('\n');
                    }
                }
                return null;
            });
            this.log.debug(`got scriptContents "${JSON.stringify(scriptContents)}"`);

            const labeltext = await page.evaluate(() => {
                // @ts-expect-error document seems to be defined by puppeteer
                // eslint-disable-next-line no-undef
                const element = document.querySelector('p[data-component="rainGraph-nowcastText"]');
                const labeltext = element ? element.textContent : '';
                return labeltext;
            });

            this.log.debug(`got labeltext "${labeltext}"`);
            this.setStateAsync('data_1h.labeltext', { val: labeltext, ack: true });

            for (const scriptContent of scriptContents) {
                if (scriptContent.includes('series')) {
                    this.log.debug('weatherData found');
                    let data = scriptContent.substring(scriptContent.indexOf('series'));

                    if (data.includes('}}},')) {
                        weatherdataFound = true;
                        data = data.substring(7, data.indexOf('}}},') + 3);
                        data = data.replace('2h', 'data2h');
                        data = data.replace('24h', 'data24h');

                        const dataJSON = JSON.parse(data);
                        this.log.debug('creating 5 min states');
                        this.createStateData(dataJSON.data2h.data, 'data_5min');

                        this.log.debug('creating 1 hour states');
                        this.createStateData(dataJSON.data24h.data, 'data_1h');
                    } else {
                        this.log.debug('end of data in series NOT found');
                    }
                }
            }

            if (!weatherdataFound) {
                this.log.warn('no weatherData found in HTML');
            }
        } catch (error) {
            this.log.warn(error);
        } finally {
            this.stop && this.stop();
        }
    }

    splitByNewline(inputString) {
        return inputString.split('\n');
    }

    //----------------------------------------------------------------------------------------------------
    async createStateData(data, channel) {
        try {
            let JSONdata_rain = [];
            let JSONdata_echart = [];
            let raindata = [];
            let isRainingNow = data[0]?.precipitationrate > 0;
            let rainStartsAt = '-1';
            let rainStartAmount = 0;

            this.setStateAsync(`${channel}.isRainingNow`, { val: isRainingNow, ack: true });

            await this.setStateAsync(`${channel}.timestamp`, { val: data[0]?.time || '', ack: true });
            await this.setStateAsync(`${channel}.actualRain`, { val: data[0]?.precipitationrate || 0, ack: true });

            for (const item of data) {
                raindata.push(item.precipitationrate);

                const date = new Date(item.time);
                const timestamp = date.getTime();

                if (rainStartsAt === '-1' && item.precipitationrate > 0) {
                    rainStartsAt = date.toISOString();
                    rainStartAmount = item.c ?? 0;
                }

                JSONdata_rain.push({
                    label: date.toLocaleTimeString('de-de', { hour: '2-digit', minute: '2-digit' }), // fromatiere ausgabe
                    value: item.precipitationrate.toString(),
                });

                JSONdata_echart.push({
                    ts: timestamp,
                    val: item.precipitationrate,
                });
            }

            this.log.debug(`Rain (${channel}): ${JSON.stringify(JSONdata_rain)}`);

            await this.setStateAsync(`${channel}.chartRain`, { val: JSON.stringify(JSONdata_rain), ack: true });
            await this.setStateAsync(`${channel}.echartRain`, { val: JSON.stringify(JSONdata_echart), ack: true });
            await this.setStateAsync(`${channel}.raindata`, { val: JSON.stringify(raindata), ack: true });
            await this.setStateAsync(`${channel}.rainStartsAt`, { val: rainStartsAt, ack: true });
            await this.setStateAsync(`${channel}.startRain`, { val: rainStartAmount, ack: true });
        } catch (error) {
            this.log.error(error);
        }
    }

    async destroyBrowser() {
        this.log.debug('destroy browser');
        const pages = await browser.pages();
        this.log.debug(`pages ${pages.length}`);
        for (let i = 0; i < pages.length; i++) {
            await pages[i].deleteCookie();
            await pages[i].close();
        }
        await browser.close();
    }

    //----------------------------------------------------------------------------------------------------
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback iobroker callback
     */
    onUnload(callback) {
        try {
            this.destroyBrowser();
            this.clearTimeout(watchdog);
            callback();
        } catch {
            callback();
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = options => new DropsWeather(options);
} else {
    // otherwise start the instance directly
    // @ts-expect-error no options is ok
    new DropsWeather();
}
