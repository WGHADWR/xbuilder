
const sys_path = require('path')
const fs = require('fs')

const Log = require('./util/log')

const __instance = (function () {
  let instance;
  return (newInstance) => {
    if (newInstance) instance = newInstance;
    return instance;
  }
}());

class AppConfiguration {

  static get Platform() {
    return process.platform;
  }

  static get __Win32__() {
    return process.platform === 'win32';
  }
  static get __Darwin__() {
    return process.platform === 'darwin';
  }

  static get __Linux__() {
    return process.platform === 'linux';
  }

  static get __Android__() {
    return !AppConfiguration.__Darwin__;
  }

  static get __IOS__() {
    return AppConfiguration.__Darwin__;
  }

  static getInstance() {
    if (!AppConfiguration.instance) {
      AppConfiguration.instance = new AppConfiguration();
    }
    return AppConfiguration.instance;
  }

  constructor() {
    if (__instance()) {
      return __instance();
    }
    this.PlatformAndroid = 'android';
    this.PlatformIOS = 'ios';
    this.ConfigFile = 'Config.json';
    this.config = {};

    this.load();
    return __instance(this);
  }

  load() {
    const path = sys_path.resolve(process.cwd(), `./node_modules/xbuilder/dist/${this.ConfigFile}`);
    if (!fs.existsSync(path)) {
      throw new Error(`The config file ${this.ConfigFile} does not exists.`);
    }
    const content = fs.readFileSync(path);
    this.config = JSON.parse(content);
  }

  getPluginVersion(name) {
    const platform = AppConfiguration.__IOS__ ? 'ios' : 'android';
    const { plugins = {} } = this.config[platform];
    return plugins[name];
  }

  getPlatformVersion() {
    const platform = AppConfiguration.__IOS__ ? 'ios' : 'android';
    const { platform: platformV } = this.config[platform];
    return platformV;
  }

  getAndroidSupportV4Version() {
    const { android_support_v4_version: version = '27.1.0' } = this.config[this.PlatformAndroid];
    return version;
  }

}

module.exports = AppConfiguration;
