const GlobalSettings = {
  __win32__: process.platform === 'win32',
  __darwin__: process.platform === 'darwin',
  tempDir: '.temp',
  artifacts: 'http://192.168.133.248/app/plugins.zip',
  platform: 'android@6.3.0',
  android_support_v4_version: '27.1.0'
}

module.exports = GlobalSettings
