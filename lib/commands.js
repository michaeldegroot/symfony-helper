'use strict'

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
      title: 'cache prod',
      value: {
        symfony:    false,
        symfony2:   'rm -rf app/cache/prod',
        symfony3:   'rm -rf var/cache/prod',
      },
    },
    {
      title: 'cache dev',
      value: {
        symfony:    false,
        symfony2:   'rm -rf app/cache/dev',
        symfony3:   'rm -rf var/cache/dev',
      },
    },
    {
      title: 'cache all',
      value: {
        symfony:    false,
        symfony2:   'rm -rf app/cache/*',
        symfony3:   'rm -rf var/cache/*',
      },
    },

    // Doctrine
    {
      title: 'database create',
      value: {
        symfony:     true,
        both:       'doctrine:database:create',
      },
    },
    {
      title: 'database update',
      value: {
        symfony:    true,
        both:       'doctrine:schema:update --force',
      },
    },
  ]
}
