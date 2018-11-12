const fs = require('fs');
const sys_path = require('path');

const Log = require('./util/log');

/**
 * package.json
 */
class PackageManager {

  constructor(oemSettings) {
    this.oemSettings = oemSettings;
    this.configs = undefined;

    this.packageConfigFile = 'package.json';
  }

  loadConfig() {
    const content = fs.readFileSync(sys_path.resolve(process.cwd(), `./${this.packageConfigFile}`));
    this.configs = JSON.parse(content);
  }

  config() {
    try {
      this.loadConfig();

      const { jpush_app_key = '', baidu_ak } = this.oemSettings;
      const pluginConfigs = {
        'jpush-phonegap-plugin': {
          'APP_KEY': jpush_app_key,
        },
        'hewz.plugins.baidu-location': {
          'API_KEY': baidu_ak,
        },
      };

      for (let name in pluginConfigs) {
        const plugin = this.configs.cordova.plugins[name];
        if (plugin) {
          for (let key in pluginConfigs[name]) {
            plugin[key] = pluginConfigs[name][key];
          }
        } else {
          Log.warn(`Can not find plugin ${name} in package.json!`);
        }
      }

      this.store();
      Log.info(`Update ${this.packageConfigFile} completed.\n`);
    } catch (e) {
      Log.info(`Update ${this.packageConfigFile} failed!`);
      Log.error(e.message);
      console.log(e);
    }
  }

  store() {
    let file = sys_path.resolve(process.cwd(), `./${this.packageConfigFile}`);
    fs.writeFileSync(file, JSON.stringify(this.configs, null, 2));
  }

}

module.exports = PackageManager
