'use strict'

const autocompletePrompt = require('cli-autocomplete')
const command            = require('./command')
const commands           = require('./commands')
const util               = require('./util')

const suggestChoices = (input) => Promise.resolve(commands.get()
    .filter((choice) => choice.title
    .slice(0, input.length) === input))

exports.start = () => {
  autocompletePrompt('What would you like to do?', suggestChoices)
  .on('submit', (choice) => {
    command.execute(choice, result => {
      util.console.success('Command finished')
    })
  })
}
