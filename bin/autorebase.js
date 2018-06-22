#!/usr/bin/env node

const simpleGit = require('simple-git')
const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')
const minimist = require('minimist')

const options = minimist(process.argv.slice(2), {
  alias: {
    push: 'p',
    branch: 'b',
    dir: 'd',
  },
  boolean: true,
  string: ['branch', 'dir'],
})

;(async function main() {
  const branch = options.branch
  const repositoriesPath = options.dir
  const repositories = await findRepositories(repositoriesPath, branch)
 
  console.log('Start git rebase for ' + repositories.join(', '))
  rebase(branch, repositories)
})()

function checkGitDirectory(repositoryPath) {
  const git = simpleGit(repositoryPath)

  return new Promise((res, rej) => {
    git.checkIsRepo((err, isRepo) => {
      if (err) rej(err)
      else res(isRepo)
    })
  })
}

function checkIncludeBranch(repositoryPath, branch) {
  const git = simpleGit(repositoryPath)

  return new Promise((res, rej) => {
    git.branch((['-v'], (err, branches) => {
      if (err) rej(err)
      else res(branches.all.includes(branch))
    }))
  })
}

async function findRepositories(cementDir, branch) {
  const isDirectory = source => lstatSync(source).isDirectory()
  const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory)
  const directories = getDirectories(cementDir)

  return (await Promise.all(directories.map(async directory => {
    return await checkGitDirectory(directory) && await checkIncludeBranch(directory, branch)
      ? directory : null
  }))).filter(Boolean)
}

function rebase(branch, repositories) {
  repositories.forEach(repository => {
    const git = simpleGit(repository)
    
    git.rebase(['origin/master', branch], function (err, data) {
      if (err) {
        git.rebase(['--abort'])

        console.log(`Rebase error for "${branch}" branch in "${repository}".`)
        return
      }
      console.log(`Rebase ${repository} completed.`)

      if (options.push) push()
    })
    
    function push() {
      git.listRemote(['--get-url'], (err, remoteUrl) => {
        if (err) {
          console.log(err)
          console.log(`Push ${repository} is failed.`)

          return
        }

        console.log(remoteUrl.replace('\n', ''))
        git.push([remoteUrl.replace('\n', ''), branch, '--force'], (err, data) => {
          git.fetch(() => console.log(`Push ${repository} to origin completed.`))
        })
      })
    }
  })
}
