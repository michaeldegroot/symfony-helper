'use strict'

const symfony = require('./symfony')

exports.symfony = () => {
  return {
    symfony2: 'app/console',
    symfony3: 'bin/console',
  }
}

exports.get = () => {
  return [
    // Caches
    {
      title: 'cache clear prod',
      value: {
        func: symfony.clearCache,
        arg:  'prod',
      },
    },
    {
      title: 'cache clear dev',
      value: {
        func: symfony.clearCache,
        arg:  'dev',
      },
    },
    {
      title: 'cache clear test',
      value: {
        func: symfony.clearCache,
        arg:  'test',
      },
    },
    {
      title: 'cache clear all',
      value: {
        func: symfony.clearCache,
        arg:  'all',
      },
    },

    // Assets
    {
      title: 'assets dump prod',
      value: {
        symfony: true,
        both:    'assetic:dump --env=prod',
      },
    },
    {
      title: 'assets dump',
      value: {
        symfony: true,
        both:    'assetic:dump',
      },
    },
    {
      title: 'assets install',
      value: {
        symfony: true,
        both:    'assets:install',
      },
    },
    {
      title: 'assets install symlink',
      value: {
        symfony: true,
        both:    'assets:install --symlink',
      },
    },
    {
      title: 'assets install symlink relative',
      value: {
        symfony: true,
        both:    'assets:install --symlink --relative',
      },
    },

    // Composer
    {
      title: 'composer install',
      value: {
        symfony: false,
        both:    'composer install',
      },
    },
    {
      title: 'composer update',
      value: {
        symfony: false,
        both:    'composer update',
      },
    },
    {
      title: 'composer validate',
      value: {
        symfony: false,
        both:    'composer validate',
      },
    },
    {
      title: 'composer self update',
      value: {
        symfony: false,
        both:    'composer self-update',
      },
    },

    // Doctrine
    {
      title: 'database create',
      value: {
        symfony: true,
        both:    'doctrine:database:create',
      },
    },
    {
      title: 'database update force',
      value: {
        symfony: true,
        both:    'doctrine:schema:update --force',
      },
    },
    {
      title: 'database update',
      value: {
        symfony: true,
        both:    'doctrine:schema:update',
      },
    },


    {
      title: 'generate entities',
      value: {
        func: symfony.generateEntities,
        arg:  'all',
      },
    },

    // Exit
    {
      title: 'exit',
      value: {
        func: () => {
          console.log('Goodbye!')
          console.log('')
          process.exit()
        },

        arg:  [''],
      },
    },
  ]
}
