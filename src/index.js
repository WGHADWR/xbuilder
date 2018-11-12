const fs = require('fs')
const sys_path = require('path')
const program = require('commander')
const inquirer = require('inquirer')

const ProcessExecutor = require('./util/process')
const Log = require('./util/log')
const StringUtils = require('./util/utils').StringUtils
const FileUtils = require('./util/utils').FileUtils
const HttpClient = require('./util/httpClient')
const Zip = require('./util/zip')

const GlobalSettings = require('./Global')
const ConfigXMLManager = require('./ConfigXMLManager')
const OEMConfigManager = require('./OEMConfigManager')
const PackageManager = require('./PackageManager')
const FetchJSONManager = require('./FetchJSONManager')
const PlatformManager = require('./PlatformManager')
const PluginManager = require('./PluginManager');

var params = process.argv.slice(2)

program.version('1.0.0')
  .option('-i, --init', 'init project')
  .option('-f, --add-platform', 'add platform')
  .option('-b, --build', 'build project')
  .option('-s, --set-oem', 'set oem configs')
  .option('-a, --install-artifacts', 'install artifacts')
  .option('-p, --install-plugins', 'install plugins')
  .option('--patch', 'set build configs')
  .parse(process.argv);


class AppBuilder {

  constructor() {
    this.installConfigs = {};
    this.oemConfigMgr = new OEMConfigManager();
    this.platformMgr = new PlatformManager();

    const packageJsonFile = sys_path.resolve(process.cwd(), `./package.json`);
    this.pluginMgr = new PluginManager(packageJsonFile);

    this.oemConfigMgr.loadConfigs();
  }
  
  async start() {
    await this.getInstallConfigs();
    // await this.installArtifacts();
    const { selectedOEM: oemId } = this.installConfigs;
    if (oemId) {
      this.setOEMConfigs();
    }
    await this.pluginMgr.install();

    const { oem = {} } = this.oemConfigMgr.OEMConfigs;
    const oemConfig = oem[oemId];
    const fetchJSONManager = new FetchJSONManager(oemConfig);
    fetchJSONManager.config();

    if (this.installConfigs.installPlatform) {
      await this.addPlatform();
    }
    return true;
  }

  async getInstallConfigs() {
    let result = await inquirer.prompt([{
      type: 'confirm',
      message: 'Install platforms now?',
      name: 'installPlatform',
      default: true
    }]);
    this.installConfigs.installPlatform = result.installPlatform;
    result = await this.selectOEM();
    this.installConfigs.selectedOEM = result.oem;
  }

  async selectOEM() {
    const oems = this.oemConfigMgr.getOEMList();
    if (oems.length === 0) {
      Log.warn('No oem options!\n');
      resolve({});
      return;
    }
    return await inquirer.prompt([{
      type: 'list',
      name: 'oem',
      message: 'Select OEM:',
      choices: oems
    }]);
  }

  skip(message) {
    return inquirer.prompt([{
      type: 'confirm',
      message: message,
      name: 'skip',
      default: false
    }]);
  }

  installDependencies() {
    let command = GlobalSettings.__win32__ ? 'npm.cmd' : 'npm';
    return ProcessExecutor.spawn(command, ['install']).then(result => {
      if (result === 0) {
        Log.info('Install dependencies completed.\n');
        return true;
      } else {
        throw new Error('Install dependencies failed!');
      }
    }).catch(reason => {
      Log.error(reason.message);
    });
  }

  async installArtifacts() {
    const tempPath = sys_path.resolve(process.cwd(), `./${GlobalSettings.tempDir}`);
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath);
    }
    let progress = 0.0;
    let inter;
    const printProgress = () => {
      if (inter) {
        return;
      }
      inter = setInterval(() => {
        Log.slog(`Downloading artifacts, progress: ${progress}%\n`, true);
      }, 350);
    }

    Log.info('Fetch artifacts ...');
    const artifactFile = 'artifacts.zip';
    const target = sys_path.resolve(process.cwd(), `./${GlobalSettings.tempDir}`, `./${artifactFile}`)

    return new Promise((resolve, reject) => {
      HttpClient.download(GlobalSettings.artifacts, target, (_progress) => {
        progress = _progress;
        printProgress();
      }).then(result => {
        clearInterval(inter);
        inter = undefined;
        Log.slog(`Downloading artifacts, progress: 100.00%\n`);
        Log.process('Unpacking artifacts');
        Zip.unpack(target, process.cwd()).then(result => {
          Log.info('Install artifacts completed.\n');
          resolve(true);
        }).catch(error => {
          Log.error(error);
          // Log.error('Unpack artifacts failed!\n')
          throw error;
        })
      }).catch(e => {
        Log.error(e);
        Log.error('Download artifacts failed!\n');
        reject(e);
      })
    })
  }

  installPlatformQA() {
    return inquirer.prompt([{
      type: 'confirm',
      name: 'addPlatform',
      message: 'Add platform now?'
    }]);
  }

  setOEMConfigs() {
    const { selectedOEM: oemId } = this.installConfigs;
    if (oemId) {
      // this.oemConfigMgr.loadConfigs();
      this.oemConfigMgr.createOemPatch(this.oemConfigMgr.OEMConfigs, oemId);
      this.oemConfigMgr.copySplashAndIcons(oemId);

      const { oem = {} } = this.oemConfigMgr.OEMConfigs;
      const oemConfig = oem[oemId];

      const configXMLManager = new ConfigXMLManager(oemConfig);
      configXMLManager.config();

      const packageManager = new PackageManager(oemConfig);
      packageManager.config();

      const fetchJSONManager = new FetchJSONManager(oemConfig);
      fetchJSONManager.config();
    }
  }

  async addPlatform() {
    try {
      await this.platformMgr.remove();
      await this.platformMgr.add();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async build() {
    this.platformMgr.setAndroidSupport();
    await this.platformMgr.build();
  }

}

class Bootstrap {

  static async startup() {
    const appBuilder = new AppBuilder();

    if (program.init) {
      appBuilder.start();
    } else if (program.build) {
      appBuilder.build();
    } else if (program.addPlatform) {
      appBuilder.addPlatform();
    } else if (program.setOem) {
      const selectedOem = await appBuilder.selectOEM() || {};
      appBuilder.installConfigs.selectedOEM = selectedOem.oem;
      appBuilder.setOEMConfigs();
    } else if (program.installPlugins) {
      appBuilder.pluginMgr.install();
    } else if (program.installArtifacts) {
      appBuilder.installArtifacts();
    } else if (program.patch) {
      appBuilder.platformMgr.setAndroidSupport();
    } else {
      program.help();
    }
  }
}

// console.log(params)
Bootstrap.startup();
