const fs = require('fs')
const sys_path = require('path')

const Log = require('./util/log')


/**
 * fetch.json
 */
class FetchConfigManager {

  constructor(oemSettings) {
    this.oemSettings = oemSettings;
    this.configs = undefined;

    this.configFile = 'fetch.json';
    this.andoridConfigFile = 'android.json';
  }

  clean() {
    const path = sys_path.resolve(process.cwd(), `./plugins/${this.andoridConfigFile}`);
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    Log.info(`${this.andoridConfigFile} has been deleted.`);
  }

  loadConfig() {
    const path = sys_path.resolve(process.cwd(), `./plugins/${this.configFile}`);
    if (fs.existsSync(path)) {
      let content = fs.readFileSync(path);
      this.configs = JSON.parse(content);
    } else {
      throw new Error(`The config file ${this.configFile} is not exists!`);
    }
  }

  config() {
    try {
      this.clean();
      this.loadConfig();

      const { jpush_app_key = '', baidu_ak } = this.oemSettings;
      const pluginConfigs = {
        'jpush-phonegap-plugin': {
          'variables': {
            'APP_KEY': jpush_app_key
          }
        },
        'hewz.plugins.baidu-location': {
          'variables': {
            'API_KEY': baidu_ak
          }
        },
      };

      for (let name in pluginConfigs) {
        if (this.configs[name]) {
          const variables = pluginConfigs[name]['variables'];
          for (let key in variables) {
            this.configs[name]['variables'][key] = variables[key];
          }
        } else {
          Log.warn(`The plugin ${name} is not installed!`);
        }
      }

      this.store();
      Log.info(`Update ${this.configFile} completed.\n`);
    } catch (e) {
      Log.info(`Update ${this.configFile} failed!`);
      Log.error(e.message);
      // console.log(e);
    }
  }

  store() {
    const file = sys_path.resolve(process.cwd(), `./plugins/${this.configFile}`);
    fs.writeFileSync(file, JSON.stringify(this.configs, null, 2));
  }

}

module.exports = FetchConfigManager
