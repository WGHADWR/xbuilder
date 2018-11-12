const fs = require('fs')
const sys_path = require('path')
const DOMParser = require('xmldom').DOMParser
const XMLSerializer = require('xmldom').XMLSerializer

const GlobalSettings = require('./Global')
const Log = require('./util/log')
const FileUtils = require('./util/utils').FileUtils

class OEMConfigManager {

  constructor() {
    this.OEMConfigs = undefined;
    // this.loadConfigs()
  }

  loadConfigs() {
    const path = sys_path.resolve(process.cwd(), `./oem/config.json`);
    if (!fs.existsSync(path)) {
      // throw new Error('OEM configuration is not found!')
      Log.warn('OEM config is not found!\n');
      return;
    }
    const content = fs.readFileSync(path).toString();
    this.OEMConfigs = JSON.parse(content);
  }

  getOEMList() {
    const items = [];
    if (this.OEMConfigs) {
      const { oem = {} } = this.OEMConfigs;
      for (let oemId in oem) {
        if (oem.hasOwnProperty(oemId)) {
          items.push(oemId);
        }
      }
    }
    return items;
  }

  createOemPatch(oemConfigs, oemId) {
    if (!oemConfigs || !oemId) {
      return;
    }
    const { oem = {} } = oemConfigs;
    if (!oem[oemId]) {
      throw new Error(`OEM(${oemId}) config is undefined.`);
    }
    const oemResPath = sys_path.resolve(process.cwd(), `./oem/${oemId}`);
    if (!fs.existsSync(oemResPath)) {
      throw new Error('OEM files is not found!');
    }

    const { name, version, productId, serverUrl, resServerUrl, updateUrl_Android, updateUrl_IOS} = oem[oemId];
    let settings = `const $OEMSettings = {\n`
      + `  ProductName: '${name}',\n`
      + `  Version: '${version}',\n`
      + `  ProductId: '${productId}',\n`
      + `  ServerUrl: '${serverUrl}',\n`
      + `  ResourceServerUrl: '${resServerUrl}',\n`
      + `  UpdateUrl: '${updateUrl_Android}',\n`
      + `  UpdateUrlIOS:\n`
      + `  '${updateUrl_IOS}'\n`
      + `};\n`
      + `\n`
      + `export const OEMSettings = $OEMSettings;\n`
      + ``;

    const path = sys_path.resolve(process.cwd(), './src/app/oem.config.ts');
    try {
      fs.writeFileSync(path, settings);
      Log.info('Generate OEM configs completed.\n');
    } catch (e) {
      Log.error(`Generate OEM configs failed!\n`);
      Log.error('Error: ' + e.message + '\n');
      Log.error(e.stack);
      throw e;
    }
  }
  
  copySplashAndIcons(oemId) {
    if (!GlobalSettings.__win32__ || !oemId) {
      return;
    }
    const oemResPath = sys_path.resolve(process.cwd(), `./oem/${oemId}`);
    if (!fs.existsSync(oemResPath)) {
      throw new Error('OEM resources is not found!');
    }
    try {
      const src = sys_path.resolve(process.cwd(), `./oem/${oemId}/resources`);
      const dest = sys_path.resolve(process.cwd(), './resources');
      FileUtils.copyDir(src, dest, (err) => {
        if (err) {
          throw err;
        }
      });
      Log.info('Copy resource files completed!\n');
    } catch (e) {
      Log.error('Copy resource files failed!\n');
      Log.error(e.stack);
      throw e;
    }
  }
}

module.exports = OEMConfigManager
