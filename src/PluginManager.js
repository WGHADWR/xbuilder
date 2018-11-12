const fs = require('fs');
const sys_path = require('path');
const GlobalSettings = require('./Global');
const ProcessExecutor = require('./util/process');

const Log = require('./util/log')

class PluginManager {

  constructor(packageConfigFile) {
    this.packageConfigFile = packageConfigFile;

    this.pluginWithNoVariables = [
      'cordova-plugin-crosswalk-webview',
    ];
  }

  getPlugins() {
    // console.log(this.packageConfigFile)
    // const path = sys_path.resolve(process.cwd(), `./${this.packageConfigFile}`);
    // console.log(path);
    if (!fs.existsSync(this.packageConfigFile)) {
      throw new Error(`package.json not found.`);
    }
    const content = fs.readFileSync(this.packageConfigFile);
    const configs = JSON.parse(content);
    if (!configs['cordova'] || !configs['cordova']['plugins']) {
      throw new Error('Can not found plugins config.');
    }
    const dependencies = configs['dependencies'] || {};
    const _plugins = configs['cordova']['plugins'] || {};
    const plugins = {};
    for (const name in _plugins) {
      plugins[name] = {
        version: dependencies[name],
        variables: _plugins[name],
      }
    }
    return plugins;
  }

  async install() {
    Log.info('Installing plugins ...');
    const plugins = this.getPlugins();
    for (let name in plugins) {
      const result = await this.installPlugin(name, plugins[name]);
      if (!result) {
        console.log(`Plugin ${name} install failed.`);
      }
    }
    Log.success('Plugins installed.\n');
  }

  async installPlugin(name, options = {}) {
    const pluginPath = sys_path.resolve(process.cwd(), `./plugins/${name}`);
    if (fs.existsSync(pluginPath)) {
      Log.info(`Plugin ${name} has been installed.`);
      return true;
    }

    const { version, variables = {} } = options;
    const args = ['plugin', 'add', name + '@' + version];
    if (this.pluginWithNoVariables.indexOf(name) === -1) {
      if (Object.keys(variables).length > 0) {
        args.push('--variable');
        for (let v in variables) {
          args.push(`${v}=${variables[v]}`);
        }
      }
    }
    Log.info(`Installing plugin ${name}@${version} ...`);
    const command = GlobalSettings.__win32__ ? 'cordova.cmd' : 'cordova'
    const result = await ProcessExecutor.spawn(command, args);
    return result.code === 0;
  }
}

module.exports = PluginManager

// console.log('start...');
// const pluginManager = new PluginManager('package.json');
// const plugins = pluginManager.getPlugins();
// console.log(JSON.stringify(plugins, null, 2));

// pluginManager.install();
