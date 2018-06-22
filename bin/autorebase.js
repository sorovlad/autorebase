#!/usr/bin/env node

const simpleGit = require('simple-git/promise')
const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')
const minimist = require('minimist')

const options = minimist(process.argv.slice(2), {
  alias: {
    push: 'p',
    branch: 'b',
    dir: 'd',
    modules: 'm',
  },
  boolean: true,
  string: ['branch', 'dir', 'modules'],
})

;(async function main() {
  const branch = options.branch
  const repositoriesPath = options.dir
  const repositories = options.modules
    ? options.modules.split(',').map(s => join(options.dir, s.trim()))
    : await findRepositories(repositoriesPath, branch)
 
  console.log('Start git rebase for ' + repositories.join(', '))
  rebase(branch, repositories)
})()

async function findRepositories(cementDir, branch) {
  const isDirectory = source => lstatSync(source).isDirectory()
  const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory)
  const directories = getDirectories(cementDir)

  return (await Promise.all(directories.map(async directory => {
    const git = simpleGit(directory)
    const isRepo = await git.checkIsRepo()

    if (!isRepo) return null

    const branches = await git.branch(['-v'])

    return branches.all.includes(branch) ? directory : null
  }))).filter(Boolean)
}

function rebase(branch, repositories) {
  repositories.forEach(async repository => {
    const git = simpleGit(repository)
    
    await git.pull(branch, { '--rebase': null })

    try {
      await git.rebase(['origin/master', branch])

      console.log(`Rebase ${repository} completed.`)
    } catch (err) {
      git.rebase(['--abort'])
      console.log(`Rebase error for "${branch}" branch in "${repository}".`)

      return
    }


    if (options.push) {
      const remoteUrl = await git.listRemote(['--get-url'])
      await git.push([remoteUrl.replace('\n', ''), branch, '--force'])
      await git.fetch()

      console.log(`Push ${repository} to origin completed.`)
    }
  })
}
