<div align="center">
  <img src="assets/logo/fast-text.svg" alt="Fastty package logo" />
</div>
<div align="center">
  <strong>
To automate the integration between your RestFul API and Front end</strong>
</div>

<br />

<div align="center">
  <a href="https://github.com/Fastty/fastty/blob/develop/LICENSE">
    <img src="https://img.shields.io/github/license/Fastty/fastty" alt="License" />
  </a>
  <a href="https://github.com/Fastty/fastty">
    <img src="https://img.shields.io/badge/npm-unavailable-red" alt="npm unavailable at moment" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" />
  </a>
  <a href="https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API">
    <img src="https://img.shields.io/badge/-powered-green?style=social&logo=typescript" alt="Typescript Compiler API Powered" />
  </a>
</div>

<div align="center">
  <sub>Built with :purple_heart: by
  <a href="https://github.com/Felipe-BP">@Felipe-BP</a>
  <div align="center">
    :star2: :eyes: :zap: :boom:
  </div>
</div>

<br />

`@Fastty` is a built in tool that automates integration between your server and client application.

## Features

- :electric_plug: Automates front end code that consumes RESTful endpoints :point_down:

- :mag_right: Nestjs Controller as input and exports Angular Service (HttpClient)

- :space_invader: Query, path params and types supported

<div
    style="display: flex; align-items: center"
>
    <img align="right" style="width: 550px; height: 450px;" src="assets/code-images/nestjs-source.png" alt="NestJS Controller Code as input for the package" />
    <strong style="text-align: justify;">Fastty exports to :point_right:</strong>
    <img align="right" style="width: 550px; height: 450px;" src="assets/code-images/angular-exported.png" alt="CRUD usage" />
</div>

## Packages

- [**@fastty/core**](#) - core package which provides `parserSource, exportSource` methods that provides all features
- [**@fastty/cli**](#) - cli package that integrates with `@fastty/core` that provides an interface for easy use of all features

## Supports
<strong>Parsers:</strong>
- [x] Nestjs
- [ ] Node

<strong>Exporters:</strong>
- [x] Angular (HttpClient)
- [ ] Axios
- [ ] Fetch API

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please check out [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) to follow project commit messages design

## Support

Any support is welcome. At least you can give a star on repo :star:

## License

[MIT](LICENSE)