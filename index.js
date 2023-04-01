const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const path = require('path');

async function run() {

  try {
    let binary = core.getInput('binary');
    let version = core.getInput('version');
    let downloadURL = core.getInput('download_url');
    let tarballBinaryPath = core.getInput('tarball_binary_path');
    let smokeTest = core.getInput('smoke_test');

    const fillTemplate = function(s) {
      s = s.replace(/\$\{binary\}/g, binary)
      s = s.replace(/\$\{version\}/g, version)
      return s
    }

    downloadURL = fillTemplate(downloadURL);
    tarballBinaryPath = fillTemplate(tarballBinaryPath)
    smokeTest = fillTemplate(smokeTest);

    core.info(`download URL:         ${downloadURL}`)
    core.info(`tarball binary path:  ${tarballBinaryPath}`)
    core.info(`smoke test:           ${smokeTest}`)

    const stripComponents = tarballBinaryPath.split("/").length - 1;

    await installTool(binary, version, downloadURL, stripComponents, tarballBinaryPath);
    await exec.exec(smokeTest);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function installTool(name, version, url, stripComponents, wildcard) {
  let cachedPath = tc.find(name, version)
  if (cachedPath) {
      core.addPath(cachedPath)
      return
  }

  const downloadedPath = await tc.downloadTool(url);
  const extractedPath = await tc.extractTar(downloadedPath, name);
  cachedPath = await tc.cacheFile(path.join(extractedPath, wildcard), name, name, version);

  core.addPath(cachedPath);
}

run();
