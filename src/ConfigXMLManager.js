const fs = require('fs')
const sys_path = require('path')
const DOMParser = require('xmldom').DOMParser
const XMLSerializer = require('xmldom').XMLSerializer

const Log = require('./util/log')

/**
 * config.xml
 */
class ConfigXMLManager {

  constructor(oemSettings) {
    this.oemSettings = oemSettings;
    this.document = undefined;
    
    this.configXmlPath = sys_path.resolve(process.cwd(), `./config.xml`);
  }

  loadConfigs() {
    let content = fs.readFileSync(this.configXmlPath);
    this.document = (new DOMParser()).parseFromString(content.toString('utf8'), 'text/xml');
  }

  config() {
    try {
      if (!this.document) {
        this.loadConfigs();
      }

      const { id, name, version } = this.oemSettings;
      let root = this.document.getElementsByTagName('widget')[0];
      root.setAttribute('id', id);
      root.setAttribute('version', version);

      let nodeName = this.document.getElementsByTagName('name')[0];
      nodeName.childNodes[0].nodeValue = name;
      nodeName.childNodes[0].data = name;

      this.setJPushAppKey();
      this.setBaiduMapAK();

      this.store();
      Log.info('Update config.xml completed.\n');
    } catch (e) {
      Log.error('Update config.xml failed!');
      Log.error(e.stack);
    }
  }

  getPlugin(name) {
    const plugins = this.document.getElementsByTagName('plugin');
    let plugin = undefined;
    for (let i = 0; i < plugins.length; i++) {
      const _plugin = plugins[i];
      let pluginName = _plugin.getAttribute('name');
      if (pluginName === name) {
        plugin = _plugin;
        break;
      }
    }
    return plugin;
  }

  getElement(parent, nodeName, attr, value) {
    let elements = parent.getElementsByTagName(nodeName);
    let el;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getAttribute(attr) === value) {
        el = elements[i];
        break;
      }
    }
    return el;
  }

  setPluginVariable(pluginName, varName, varValue) {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      Log.warn(`The plugin ${pluginName} is not installed!`);
      return;
    }
    
    const variable = this.getElement(plugin, 'variable', 'name', varName);
    if (!variable) {
      Log.warn(`The plugin ${pluginName} is invalid, cannot find varable '${varName}', please reinstall!`);
      return;
    }
    variable.setAttribute('value', varValue);
  }

  setJPushAppKey() {
    let plugin_name = 'jpush-phonegap-plugin';
    const { jpush_app_key = '' } = this.oemSettings;
    this.setPluginVariable(plugin_name, 'APP_KEY', jpush_app_key);
  }

  setBaiduMapAK() {
    let plugin_name = 'hewz.plugins.baidu-location';
    const { baidu_ak = '' } = this.oemSettings;
    this.setPluginVariable(plugin_name, 'API_KEY', baidu_ak);
  }

  store() {
    let content = (new XMLSerializer()).serializeToString(this.document);
    fs.writeFileSync(this.configXmlPath, content);
  }

}

module.exports = ConfigXMLManager
