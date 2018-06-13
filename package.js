Package.describe({
    name: 'malibun23:vkapi',
    version: '0.0.1',
    summary: 'vk api meteor',
    git: 'https://github.com/vadkasevas/node-vkapi',
    documentation: null
});

Npm.depends({
    "cheerio": "0.22.0",
    "fetch-cookie": "0.7.0",
    "form-data": "2.3.1",
    "node-fetch": "1.7.3",
    "chai":"4.1.2",
    "chai-as-promised": "7.1.1",
});

Package.onUse(function(api) {
    api.versionsFrom('1.6.1');
    api.use('meteor-base');
    api.use('ecmascript@0.10.6');
    api.use('malibun23:stack');
    api.use('underscore');

    api.addFiles('src/VkClient.js','server');
    api.addFiles('src/errors/api-error.js','server');
    api.addFiles('src/errors/auth-error.js','server');
    api.addFiles('src/errors/upload-error.js','server');

    api.addFiles('src/lib/fetch.js','server');
    api.addFiles('src/lib/captcha-recognizer.js','server');


    api.addFiles('src/constants.js','server');
    api.addFiles('src/vkapi.js','server');

    api.addAssets(['examples/resources/dog.jpg'],'server');

    api.export(['VkClient','VkApiError','VkAuthError','VkUploadError','VkApi'],['server'] );


});

Package.onTest(function(api) {
    api.use('malibun23:stack');
    api.use('malibun23:vkapi');
    api.use(['ecmascript@0.10.6', 'cultofcoders:mocha','practicalmeteor:chai']);
    api.use('underscore');
    api.addAssets(['examples/resources/dog.jpg'],'server');
    api.addFiles('tests/vkapi.test.js');
});
