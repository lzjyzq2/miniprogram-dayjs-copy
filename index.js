#!/usr/bin/env node
const {
    resolve
} = require("path");
const {
    copyFile,
    existsSync,
    readdirSync,
    mkdirSync,
    copyFileSync,
    constants
} = require('fs')
const workspace = process.cwd()
const dayjs = 'dayjs'
const miniprogram_npm_dir = './miniprogram_npm'
const node_modules_dir = './node_modules'

const packagePath = process.env['npm_package_json']
const {
    config
} = require(packagePath);

if (config && config['miniprogram-dayjs-copy']) {
    const pluginConf = config['miniprogram-dayjs-copy']
    if (Array.isArray(pluginConf)) {
        copyPlugin({
            miniprogram_npm_dir,
            node_modules_dir,
            plugins: pluginConf,
            esm: false
        })
    } else if (pluginConf['plugins'] && Array.isArray(pluginConf['plugins'])) {
        copyPlugin({
            miniprogram_npm_dir: getMiniprogramNpmDir(pluginConf),
            node_modules_dir: getNodeModulesDir(pluginConf),
            plugins: pluginConf.plugins,
            esm: pluginConf.esm ?? false
        })
    } else {
        console.warn('没有插件需要移动')
    }
}

function getMiniprogramNpmDir(pluginConf) {
    return pluginConf['miniprogram_npm'] ?? './miniprogram_npm'
}

function getNodeModulesDir(pluginConf) {
    return pluginConf['node_modules'] ?? './node_modules'
}

function copyPlugin(pluginConf) {
    const {
        miniprogram_npm_dir,
        node_modules_dir,
        plugins,
        esm
    } = pluginConf
    const dayjsPath = esm ? dayjs + "/esm" : dayjs
    const miniprogramNpmDayjsPluginDir = resolve(workspace, miniprogram_npm_dir, dayjsPath)
    const nodeModulesDayjsPluginDir = resolve(workspace, node_modules_dir, dayjsPath)
    if (esm) {
        copyEsmEntry(miniprogramNpmDayjsPluginDir, nodeModulesDayjsPluginDir)
        plugins.forEach(it => {
            const sd = resolve(nodeModulesDayjsPluginDir, it)
            const td = resolve(miniprogramNpmDayjsPluginDir, it)
            if (it.indexOf('locale') != -1) {
                copy(miniprogramNpmDayjsPluginDir, nodeModulesDayjsPluginDir, it)
            } else {
                copyEsm(sd, td)
            }
        })
    } else {
        plugins.forEach(it => {
            copy(miniprogramNpmDayjsPluginDir, nodeModulesDayjsPluginDir, it)
        })
    }
}

function copy(miniprogramNpmDayjsPluginDir, nodeModulesDayjsPluginDir, fileName) {
    const sf = resolve(nodeModulesDayjsPluginDir, fileName + '.js')
    if (!existsSync(sf)) {
        console.error('不存在该插件:' + sf)
    }
    const td = resolve(miniprogramNpmDayjsPluginDir, fileName.indexOf('locale') != -1 ? 'locale' : 'plugin')
    if (!existsSync(td)) {
        mkdirSync(td, {
            recursive: true
        })
    }
    const tf = resolve(miniprogramNpmDayjsPluginDir, fileName + '.js')
    copyFile(resolve(sf), tf, handleCopyCallBack)
    if (fileName.indexOf('locale') === -1) {
        const sfd = resolve(nodeModulesDayjsPluginDir, fileName + '.d.ts')
        const tfd = resolve(miniprogramNpmDayjsPluginDir, fileName + '.d.ts')
        copyFile(sfd, tfd, handleCopyCallBack)
    }
}

function handleCopyCallBack(e) {
    if (e) {
        throw e
    }
}

function copyEsm(sd, td) {
    if (!existsSync(sd)) {
        console.error('不存在该插件目录:' + sd)
        return
    }
    if (!existsSync(td)) {
        mkdirSync(td, {
            recursive: true
        })
    }
    const sourceFile = readdirSync(sd, {
        withFileTypes: true
    })
    for (const file of sourceFile) {
        const srcFile = resolve(sd, file.name)
        const tagFile = resolve(td, file.name)
        if (file.isDirectory() && !existsSync(tagFile)) {
            mkdirSync(tagFile, {
                recursive: true
            })
            copyEsm(srcFile, tagFile)
        } else if (file.isDirectory() && existsSync(tagFile)) {
            copyEsm(srcFile, tagFile)
        }
        !file.isDirectory() && copyFileSync(srcFile, tagFile, constants.COPYFILE_FICLONE)
    }
}

function copyEsmEntry(miniprogramNpmDayjsPluginDir, nodeModulesDayjsPluginDir) {
    if (!existsSync(nodeModulesDayjsPluginDir)) {
        console.error(nodeModulesDayjsPluginDir + '文件夹不存在，请检查是否安装dayjs')
    }
    if (!existsSync(miniprogramNpmDayjsPluginDir)) {
        mkdirSync(miniprogramNpmDayjsPluginDir, {
            recursive: true
        })
    }
    const sourceFile = readdirSync(nodeModulesDayjsPluginDir, {
        withFileTypes: true
    })
    for (const file of sourceFile) {
        const tagFile = resolve(miniprogramNpmDayjsPluginDir, file.name)
        const srcFile = resolve(nodeModulesDayjsPluginDir, file.name)
        if (!file.isDirectory()) {
            copyFileSync(srcFile, tagFile, constants.COPYFILE_FICLONE)
        }
    }
}