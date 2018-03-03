# node-vkapi &middot; [![npm](https://img.shields.io/npm/v/node-vkapi.svg)](http://npmjs.org/node-vkapi) [![npm](https://img.shields.io/npm/dt/node-vkapi.svg)](http://npmjs.org/node-vkapi)

```bash
$ npm install node-vkapi --only=prod
```

> Refer to [README_EN.md](README_EN.md) for english docs.

## Возможности

* Простой вызов всех существующих методов API ВКонтакте
* Авторизация пользователя и получение токена
  1. *Прямая авторизация* через официальное приложение (Android, iPhone)
  2. Авторизация через Web-версию сайта
* Загрузка файлов любого типа
* Разгадывание капчи с помощью стороннего сервиса

## Пример использования
```javascript
const vkapi = new (require('node-vkapi'))();

// Получение некоторых данных о пользователе id1
// и вывод их в консоль.

vkapi.call('users.get', {
  user_ids: '1',
  fields:   'verified,sex'
})
  .then(users => console.dir(users[0]))
  .catch(error => console.error(error));
```

## Документация

### new VkApi([options])
* `options<Object>` [Опции](#options) экземпляра *VkApi*

#### Options
Свойства объекта *options* и их значения по умолчанию.

```javascript
{
  accessToken:    null,           // <String> Ключ доступа
  apiVersion:     '5.68',         // <String> Версия API
  appId:          null,           // <Number> ID приложения ВКонтакте
  appSecret:      null,           // <String> Секретный ключ приложения ВКонтакте
  captchaApiKey:  null,           // <String> API ключ сервиса по распознаванию капчи
  captchaService: 'anti-captcha', // <String> Сервис по распознаванию капчи (anti-captcha, antigate, rucaptcha)
  userLogin:      null,           // <String> Логин пользователя
  userPassword:   null,           // <String> Пароль пользователя
  baseDelay:      334             // <Number> Базовая задержка между вызовами API (334 составляет ~1/3 секунды и используется для авторизации через токен пользователя)
}
```

### vkapi.authorize(params)
* `params<Object>` [Параметры](#params) запроса
* Returns [`Promise<AuthResponseObject>`](#Формат-ответа-на-запрос-авторизации)

Осуществляет *прямую авторизацию*, т.е. авторизует пользователя в одном из официальных приложений ВКонтакте, используя логин и пароль пользователя.

#### Params
Параметры запроса на прямую авторизацию и их значения по умолчанию.

```javascript
{
  client:   'android',                  // <String> Клиент (android, iphone)
  login:    vkapi.options.userLogin,    // <String> Логин пользователя
  password: vkapi.options.userPassword, // <String> Пароль пользователя
  scope:    MAX_SCOPE                   // <String> Строка разрешений. По умолчанию будут запрашиваться все возможные разрешения
}
```

### vkapi.call(method[, params])
* `method<String>` Название метода
* `params<Object>` Параметры метода
* Returns `Promise<Any>`

Вызывает методы API ВКонтакте.

> При вызове метода `execute` будет возвращён полный ответ от ВКонтакте. [Подробнее](https://github.com/olnazx/node-vkapi/issues/16)

### vkapi.logIn(params)
* `params<Object>` [Параметры](#params-1) запроса
* Returns [`Promise<AuthResponseObject>`](#Формат-ответа-на-запрос-авторизации)

Авторизует пользователя через мобильную Web-версию ВКонтакте.  
При этом есть возможность использовать ID **неофициального** приложения.

#### Params
Параметры запроса на авторизацию через Web-версию и их значения по умолчанию.

```javascript
{
  appId:    vkapi.options.appId,        // <Number> ID приложения ВКонтакте
  login:    vkapi.options.userLogin,    // <String> Логин пользователя
  password: vkapi.options.userPassword, // <String> Пароль пользователя
  scope:    MAX_SCOPE                   // <String> Строка разрешений. По умолчанию будут запрашиваться все возможные разрешения
}
```

### vkapi.upload(type, files[, params[, afterUploadParams]])
* `type<String>` [Тип загрузки](#Типы-загрузок)
* `files<Any>` [Файл(ы)](#files) к загрузке
* `params<Object>` Параметры запроса на получение URL для загрузки. [Подробнее](https://vk.com/dev/upload_files)
* `afterUploadParams<Object>` Параметры запроса на сохранение загруженного файла. [Подробнее](https://vk.com/dev/upload_files)
* Returns `Promise<Any>`

Выполняет загрузку файлов во ВКонтакте.  

> Не забывайте, что для загрузки файлов вы должны иметь соответствующие разрешения.

#### Типы загрузок
* `audio` [Аудиозапись](https://vk.com/dev/upload_files_2?f=8.+%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0+%D0%B0%D1%83%D0%B4%D0%B8%D0%BE%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B5%D0%B9)
* `cover` [Обложка сообщества](https://vk.com/dev/upload_files_2?f=11.%2B%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%2B%D0%BE%D0%B1%D0%BB%D0%BE%D0%B6%D0%BA%D0%B8%2B%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B0)
* `document` [Документ](https://vk.com/dev/upload_files_2?f=10.%20%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%BE%D0%B2)
* `document_pm` Документ в личное сообщение
* `document_wall` Документ на стену
* `photo_album` [Фотография(ии) в альбом](https://vk.com/dev/upload_files?f=1.%2B%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%2B%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B9%2B%D0%B2%2B%D0%B0%D0%BB%D1%8C%D0%B1%D0%BE%D0%BC)
* `photo_main` [Главная фотография](https://vk.com/dev/upload_files?f=3.%20%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%20%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%BE%D0%B9%20%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8%20%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D0%B5%D0%BB%D1%8F%20%D0%B8%D0%BB%D0%B8%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B0)
* `photo_market` [Фотография для товара](https://vk.com/dev/upload_files_2?f=6.%2B%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%2B%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8%2B%D0%B4%D0%BB%D1%8F%2B%D1%82%D0%BE%D0%B2%D0%B0%D1%80%D0%B0)
* `photo_market_album` [Фотография для подборки товаров](https://vk.com/dev/upload_files_2?f=7.%20%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%20%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8%20%D0%B4%D0%BB%D1%8F%20%D0%BF%D0%BE%D0%B4%D0%B1%D0%BE%D1%80%D0%BA%D0%B8%20%D1%82%D0%BE%D0%B2%D0%B0%D1%80%D0%BE%D0%B2)
* `photo_pm` [Фотография в личное сообщение](https://vk.com/dev/upload_files?f=4.%2B%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%2B%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8%2B%D0%B2%2B%D0%BB%D0%B8%D1%87%D0%BD%D0%BE%D0%B5%2B%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5)
* `photo_wall` [Фотография на стену](https://vk.com/dev/upload_files?f=2.%20%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%20%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B9%20%D0%BD%D0%B0%20%D1%81%D1%82%D0%B5%D0%BD%D1%83)
* `video` [Видеозапись](https://vk.com/dev/upload_files_2?f=9.%2B%D0%97%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B0%2B%D0%B2%D0%B8%D0%B4%D0%B5%D0%BE%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B5%D0%B9)

#### Files
Переменная **files** может быть как единственным файлом к загрузке, так и массивом файлов (только для типа *photo_album*). Каждый отдельный файл должен представлять собой *FS Stream* либо объект, который содержит следующие свойства:  

| Свойство | Тип    |                  |
|----------|:-------|------------------|
| content  | Buffer | Содержимое файла |
| name     | String | Имя файла        |

#### Как загружать граффити и аудио-сообщения?
Для того, чтобы загрузить граффити или аудио-сообщение, нужно указать `document` как тип загрузки, а в параметрах запроса `params` указать тип загружаемого документа: для граффити — это `graffiti`, для аудио-сообщения — `audio_message`.

```javascript
// Простейший пример загрузки аудио-сообщения

const fs    = require('fs');
const vkapi = new (require('node-vkapi'))({ accessToken: 'your_access_token' });

vkapi.upload('document', fs.createReadStream('./path/to/audiofile.mp3'), { type: 'audio_message' })
  .then(response => console.dir(response))
  .catch(error => console.error(error));
```

#### Пример загрузки файла
Примеры загрузки файлов вы можете найти в папке [examples](examples).

#### Формат ответа на запрос авторизации
Функции `vkapi.authorize()` и `vkapi.logIn()` возвращают ответ в одинаковом формате.

```javascript
{
  access_token // <String> Ключ доступа
  expires_in   // <Number> Время в секундах, через которое ключ станет недействительным
  user_id      // <Number> ID пользователя
  ?email       // <String> E-mail пользователя. Включается в ответ, если был запрошен в параметре "scope" при авторизации
}
```
