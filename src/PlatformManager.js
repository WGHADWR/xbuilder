const fs = require('fs')
const sys_path = require('path')
const inquirer = require('inquirer')

const AppConfiguration = require('./AppConfiguration')
const Log = require('./util/log')
const FileUtils = require('./util/utils').FileUtils
const StringUtils = require('./util/utils').StringUtils
const ProcessExecutor = require('./util/process')

class PlatformManager {

  async build() {
    const result = await inquirer.prompt([{
      type: 'list',
      name: 'model',
      message: 'Build:',
      choices: ['Debug', 'Release']
    }]);

    const buildModel = result.model === 'Release' ? '--release --prod' : '--debug';

    this.initCordovaProject();
    const platform = AppConfiguration.__Darwin__ ? 'ios' : 'android';
    const path = sys_path.resolve(process.cwd(), `./platforms/${platform}`);
    if (!fs.existsSync(path)) {
      throw new Error('Platform is not added.');
    }
    // console.log(process.cwd())
    const command = AppConfiguration.__Darwin__ ? 'ionic' : 'ionic.cmd';
    return await ProcessExecutor.spawn(command, ['cordova', 'build', platform, buildModel]);
  }

  async add() {
    this.initCordovaProject();

    let platform = AppConfiguration.__Darwin__ ? 'ios' : 'cordova-android';
    const command = AppConfiguration.__Win32__ ? 'cordova.cmd' : 'cordova';

    let platformVersion = 'latest';
    if (!AppConfiguration.__Darwin__) {
      platformVersion = AppConfiguration.getInstance()
          .getPlatformVersion(appConfig.PlatformAndroid);
    }
    platform = platform + '@' + platformVersion;
    
    Log.debug(`Installing platform ${platform} ...\n`);
    let result = await ProcessExecutor.spawn(command, ['platform', 'add', platform]);
    if (result.code !== 0) {
      throw new Error(`Install platform ${platform} failed.`);
    }

    if (!AppConfiguration.__Darwin__) {
      this.setAndroidSupport();
    }
    Log.info(`Platform ${platform} is added.`);
  }

  async remove() {
    const platform = AppConfiguration.__Darwin__ ? 'ios' : 'android';
    const command = AppConfiguration.__Win32__ ? 'cordova.cmd' : 'cordova';

    Log.debug(`Removing installed platform ...\n`);
    return await ProcessExecutor.spawn(command, ['platform', 'remove', platform]);
  }

  initCordovaProject() {
    var dir_www = 'www';
    var dir_platform = 'platforms';

    let path = sys_path.resolve(process.cwd(), `./${dir_www}`);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    path = sys_path.resolve(process.cwd(), `./${dir_platform}`);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    // Log.info('Create directory www, platforms.');
  }

  /*
  configurations.all {
      resolutionStrategy {
          force 'com.android.support:support-v4:27.1.0'
      }
  }
  */
  setAndroidSupport() {
    if (AppConfiguration.__Darwin__) {
      return;
    }
    try {
      const platformPath = sys_path.resolve(process.cwd(), './platforms/android');
      if (!fs.existsSync(platformPath)) {
        throw new Error(`The platform is not added!`);
      }
      const android_support_v4_version = AppConfiguration.getInstance().getAndroidSupportV4();
      if (!android_support_v4_version) {
        throw new Error(`Unspecified parameter ${android_support_v4_version}`);
      }

      const path = sys_path.resolve(process.cwd(), './platforms/android/build.gradle');
      let content = FileUtils.readSync(path);

      let queryString = `force 'com.android.support:support-v4:`;
      const pos = content.indexOf(queryString);
      if (pos !== -1) {
        let version = content.substring(pos, content.indexOf('\n', pos) - 1);
        version = version.split(':')[2];
        if (version !== android_support_v4_version) {
          let newl = queryString + android_support_v4_version + '\'';
          queryString = queryString + version + '\'';
          content = content.replace(queryString, newl);
          fs.writeFileSync(path, content, {encoding: 'UTF-8'});
        }
      } else {
        let anchor = 'buildscript';
        let index = content.indexOf(anchor);

        queryString = queryString + android_support_v4_version + '\'';
        let patch = `configurations.all {
            resolutionStrategy {
                ${queryString}
            }
        }`;

        let data = StringUtils.trimEnd(content.substr(0, index), '\n') + '\n\n'
          + patch + '\n\n' + content.substr(index);
        fs.writeFileSync(path, data, {encoding: 'UTF-8'});
      }
      Log.info('Set android support completed.\n');
    } catch (e) {
      Log.error('Set android support failed!\n');
      throw e;
    }
  }

}

module.exports = PlatformManager
