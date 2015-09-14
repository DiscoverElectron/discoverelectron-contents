---
title: Generating Icons for Your App
author: Daniel Perez Alvarez
tags: [Articles]
---

Generating the different icons for your application is a bit of a pain. Windows, Mac and Linux each have different requirements in terms of sizes and formats, so you really need to automate the process if you want to keep your sanity.

I'll tell you my approach. Let me know if yours is better.


## Automate All the Things

I like having all the steps necessary to build a project as executable commands. That way they are all documented, and they can be easily run by anyone working on the project.

There are many ways to register those commands:

* We can use the `scripts` block of our `package.json` file.
* We can use a `Makefile`.
* We can use task runners like [Grunt](http://gruntjs.com/) or [Gulp](http://gulpjs.com/).

In this article I've gone with Grunt, plus the [`grunt-sharp` plugin](https://www.npmjs.com/package/grunt-sharp) to resize images, and the [`grunt-shell` plugin](https://www.npmjs.com/package/grunt-shell) to execute external commands, but feel free to try other options.


### Using grunt-sharp

This Grunt plugin relies on the awesome [`sharp` library](http://sharp.dimens.io/) to resize images. The way to configure it is by providing a `files` property and an `options` property.

The `files` property is kind of standard, and is documented in the [Globbing patterns](http://gruntjs.com/configuring-tasks#globbing-patterns) and [Building the `files` object dynamically](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically) sections of the Grunt docs.

The `options` property can be an object, or an array of objects. Each of those objects contains the operations we want to apply to the images. All operations described in the [Resizing](http://sharp.dimens.io/en/stable/api/#resizing) and [Operations](http://sharp.dimens.io/en/stable/api/#operations) sections of the `sharp` docs are supported.

For example, if we wanted to resize all images in our `src` folder to 48x48, add a white background, and output the results to `dist`, we'd write something like this:

```js
module.exports = function (grunt) {
  grunt.initConfig({
    sharp: {
      resize: {
        files: {
          expand: true,
          cwd: 'src/',
          src: ['**/*.png'],
          dest: 'dist/'
        },
        options: {
          background: 'white',
          flatten: true,
          resize: [48, 48]
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-sharp')
}
```

If we wanted to generate multiple sizes for each image, we could do this instead:

```js
module.exports = function (grunt) {
  grunt.initConfig({
    sharp: {
      resize: {
        files: {
          expand: true,
          cwd: 'src/',
          src: ['**/*.png'],
          dest: 'dist/'
        },
        options: {
          tasks: [
            {resize: 16,  rename: '{base}-small.{ext}'},
            {resize: 48,  rename: '{base}-medium.{ext}'},
            {resize: 256, rename: '{base}-big.{ext}'}
          ]
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-sharp')
}
```

We could also have multiple targets that apply different sets of operations:

```js
module.exports = function (grunt) {
  grunt.initConfig({
    sharp: {
      resize: {
        files: {/*...*/},
        options: {/*...*/}
      },
      rotate: {
        files: {/*...*/},
        options: {/*...*/}
      }
    }
  })

  grunt.loadNpmTasks('grunt-sharp')
}
```

We'd then invoke a specific target by running:

```
$ grunt sharp:resize
Running "sharp:resize" (sharp) task
>> Generated 3 images
```


### Using grunt-shell

This Grunt plugin calls `child_process.exec` to execute whatever command we tell it. It takes a bunch of options, but in its most basic form we just need to specify the command we want to run as a string. We can have multiple targets, each with its own command:

```js
module.exports = function (grunt) {
  grunt.initConfig({
    shell: {
      hello: {
        command: 'echo hello'
      },
      bye: {
        command: 'echo bye'
      }
    }
  })

  grunt.loadNpmTasks('grunt-shell')
}
```

We can then invoke each target by running something like this:

```
$ grunt shell:hello
Running "shell:hello" (shell) task
hello
```


## Icons on Windows

The [official documentation on Windows desktop icons](https://msdn.microsoft.com/en-us/library/windows/desktop/dn742485(v=vs.85).aspx) says that application icons need to include sizes 16x16, 32x32, 48x48 and 256x256, and need to be in `.ico` format.

We'll use `grunt-sharp` to generate the different sizes:

```js
grunt.initConfig({
  // ...
  sharp: {
    // ...
    'app-icon-win': {
      files: [{
        expand: true,
        cwd: 'resources/',
        src: 'icon.png',
        dest: 'dist/resources/win/app-icon/'
      }],
      options: {
        tasks: [
          {resize: 16,  rename: 'icon_16x16.png'},
          {resize: 32,  rename: 'icon_32x32.png'},
          {resize: 48,  rename: 'icon_48x48.png'},
          {resize: 256, rename: 'icon_256x256.png'}
        ]
      }
    }
  }
})
```

And we'll use `grunt-shell` to execute ImageMagick's `convert` command-line tool and produce the `.ico` file:

```js
grunt.initConfig({
  // ...
  shell: {
    // ...
    'app-icon-win': {
      command: 'convert dist/resources/win/app-icon/* dist/resources/win/app-icon.ico'
    }
  }
})
```

If you don't have ImageMagick installed, do so through `apt-get` or `brew`, or grab one of their [binary releases](http://www.imagemagick.org/script/binary-releases.php).


## Icons on Mac

The [high-resolution guidelines for OS X](https://developer.apple.com/library/mac/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) say icons need to include sizes 16x16, 16x16@2x, 32x32, 32x32@2x, 128x128, 128x128@2x, 256x256, 256x256@2x, 512x512, 512x512@2x, and be in `.icns` format.

Again, we'll use `grunt-sharp` to generate the required sizes:

```js
grunt.initConfig({
  // ...
  sharp: {
    // ...
    'app-icon-mac': {
      files: [{
        expand: true,
        cwd: 'resources/',
        src: 'icon.png',
        dest: 'dist/resources/mac/app-icon.iconset/'
      }],
      options: {
        tasks: [
          {resize: 16,   rename: 'icon_16x16.png'},
          {resize: 32,   rename: 'icon_16x16@2x.png'},
          {resize: 32,   rename: 'icon_32x32.png'},
          {resize: 64,   rename: 'icon_32x32@2x.png'},
          {resize: 128,  rename: 'icon_128x128.png'},
          {resize: 256,  rename: 'icon_128x128@2x.png'},
          {resize: 256,  rename: 'icon_256x256.png'},
          {resize: 512,  rename: 'icon_256x256@2x.png'},
          {resize: 512,  rename: 'icon_512x512.png'},
          {resize: 1024, rename: 'icon_512x512@2x.png'}
        ]
      }
    }
  }
})
```

It's important that the destination folder has a name ending in `.iconset`, to signal to the system that it contains a set of icons.

We'll use `grunt-shell` to invoke the `iconutil` command-line tool that comes with OS X in order to generate the `.icns` file:

```js
grunt.initConfig({
  // ...
  shell: {
    // ...
    'app-icon-mac': {
      command: 'iconutil -c icns -o dist/resources/mac/app-icon.icns dist/resources/mac/app-icon.iconset'
    }
  }
})
```


## Icons on Linux

On Linux we can get away with generating just a 512x512 version of our icon, and keeping it in `.png` format:

```js
grunt.initConfig({
  // ...
  sharp: {
    // ...
    'app-icon-linux': {
      files: [{
        expand: true,
        cwd: 'resources/',
        src: 'icon.png',
        dest: 'dist/resources/linux/'
      }],
      options: {
        tasks: [
          {resize: 512, rename: 'app-icon.png'}
        ]
      }
    }
  }
})
```


## Wrapping Up

We've managed to automate all tasks related to icon generation without writing too much code. We could go further and create a task that executes all other tasks:

```js
module.exports = function (grunt) {
  grunt.initConfig({
    // ...
  })

  grunt.loadNpmTasks('grunt-sharp')
  grunt.loadNpmTasks('grunt-shell')

  grunt.registerTask('icons', [
    'sharp:app-icon-win',
    'shell:app-icon-win',
    'sharp:app-icon-mac',
    'shell:app-icon-mac',
    'sharp:app-icon-linux'
  ])
}
```

Then we'd only need to run:

```
$ grunt icons
```

One of the applications we develop in the **Discover Electron** book, [Negatron](https://github.com/DiscoverElectron/negatron/), generates both its application icon and its installer icons using these techniques, so you may want to check that out.
