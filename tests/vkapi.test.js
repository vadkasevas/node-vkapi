const fs            = Npm.require('fs');
const path          = Npm.require('path');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;
import {md5} from 'meteor/malibun23:stack';

var httpContext = new HttpContext();
httpContext.on('client',(client)=>{
    //console.log('onclient');
    //client.withProxy({protocol:'http',ip:'127.0.0.1',port:8889})
});

const vkapiWithToken = new VkApi({
    accessToken: process.env.VK_TOKEN,secret:process.env.VK_SECRET,
    context:httpContext
});

describe('VkApi', () => {
    let vkapiDefault = new VkApi();
    console.log('process.env.VK_LOGIN:', process.env.VK_LOGIN);
    console.log('process.env.VK_PASS:', process.env.VK_PASS);
    console.log('process.env.VK_TOKEN:', process.env.VK_TOKEN);
    const logInDetails = {
        login: process.env.VK_LOGIN,
        password: process.env.VK_PASS
    };
    const appIdToLogIn = 6121396; // VK Admin

    beforeEach(() => {
        vkapiDefault = new VkApi();
    });

    it('should correctly merge objects', () => {
        expect(vkapiDefault.options.appSecret).to.be.null;
        expect((new VkApi({appSecret: 'appSecretKey'})).options.appSecret).to.equal('appSecretKey');
    });

    it('should has a correct base delay', () => {
        expect(vkapiDefault.options.baseDelay).to.equal(334);
        // 50 is 1/20 of a second and it's used in an authorization via a community token
        expect((new VkApi({baseDelay: 50})).options.baseDelay).to.equal(50);
    });

    it('should correctly initialize CaptchaRecognizer', () => {
        const vkapiWithCaptchaRecognizer = new VkApi({captchaApiKey: 'captchaServiceApiKey'});

        expect(vkapiDefault.captchaRecognizer).to.be.null;
        expect(vkapiWithCaptchaRecognizer.captchaRecognizer.constructor.name).to.equal('CaptchaRecognizer');
        expect(vkapiWithCaptchaRecognizer.captchaRecognizer.apiKey).to.equal('captchaServiceApiKey');
    });

    describe('authorize()', () => {
        return;
        it('should perform a successful direct authorization', () => {
            return vkapiDefault.authorize(logInDetails)
                .then(response => {
                    expect(typeof response).to.equal('object');
                    console.log('response.access_token:', response.access_token);
                    expect(typeof response.access_token).to.equal('string');
                    expect(typeof response.user_id).to.equal('number');
                    expect(typeof response.expires_in).to.equal('number');
                });
        });

        /*
            it('should throw an error if no correct params provided', () => {
              return Promise.all([
                expect(vkapiDefault.authorize()).to.be.rejectedWith(Error),

                expect(vkapiDefault.authorize({ client: 'unknown_client' })).to.be.rejectedWith(Error),
                expect(vkapiDefault.authorize({ login: 'userlogin@mail.ru' })).to.be.rejectedWith(Error),
                expect(vkapiDefault.authorize({ password: 'pass12345' })).to.be.rejectedWith(Error)
              ]);
            });
        */
        /*it('should throw an error if password or login is incorrect', () => {
          return expect(
            vkapiDefault.authorize({
              login:    'userlogin@vk.com',
              password: 'mypassword123'
            })
          )
            .to.be.rejectedWith(VkAuthError);
        });*/
    });

    describe('call()', () => {
        return;
        it('should perform a successful API request', () => {
            return vkapiWithToken.call('users.get', {
                user_ids: '1'
            })
                .then(response => {
                    expect(Array.isArray(response)).to.be.true;
                    expect(response).to.have.lengthOf(1);
                    expect(response[0].id).to.equal(1);
                });
        });

        it('should throw an error if no correct method provided', () => {
            return expect(vkapiDefault.call()).to.be.rejectedWith(Error)
        });

        it('should throw an error if unknown method called', () => {
            return vkapiWithToken.call('unknown_method')
                .catch(error => {
                    expect(error instanceof VkApiError).to.be.true;
                    expect(typeof error.code).to.equal('number');
                    expect(typeof error.message).to.equal('string');
                });
        });

        it('should return full response object for "execute" method', () => {
            return vkapiWithToken.call('execute', {
                // Calling this method without any params
                // will throw an "in-execute" error
                code: 'return [API.docs.search()];'
            })
                .then(response => {
                    expect(typeof response).to.equal('object');
                    expect(response).to.have.property('response');
                    expect(response).to.have.property('execute_errors');
                    expect(Array.isArray(response.response)).to.be.true;
                    expect(Array.isArray(response.execute_errors)).to.be.true;
                });
        });
    });

    /*describe('logIn()', () => {
        it('should perform a successful authorization through web-version of VK', () => {
            return vkapiDefault.logIn(Object.assign(logInDetails, {
                appId: appIdToLogIn
            }))
                .then(response => {
                    expect(typeof response).to.equal('object');
                    expect(typeof response.access_token).to.equal('string');
                    expect(typeof response.user_id).to.equal('number');
                    expect(typeof response.expires_in).to.equal('number');
                });
        });
    });*/

    describe('upload()', () => {
        /*
        it('should perform a successful photo_wall uploading (FS Stream)', function(){
            this.timeout(30000);
            return vkapiWithToken.upload('photo_wall', fs.createReadStream(Assets.absoluteFilePath('examples/resources/dog.jpg')))
                .then(response => {
                    expect(Array.isArray(response)).to.be.true;
                    expect(response).to.have.lengthOf(1);
                    expect(response[0]).to.have.property('id');
                });
        });
*/
        it('should perform a successful photo_wall uploading (Buffer)',function(done){
            this.timeout(30000);

            vkapiWithToken.call('photos.getAlbums',{owner_id:487568993,need_system:1});

            vkapiWithToken.upload('PHOTO_MAIN', Assets.absoluteFilePath('examples/resources/dog.jpg'))
                .then(response => {
                    console.log(response);
                    expect(response).to.have.property('photo_hash');
                    done();
                })
                .catch(error => {
                    done(error);
                });

        });


    });

    describe('sig',()=>{
        //it('sig',()=>{
            var params = {
                v:'5.68',
                lang:'ru',
                https:1,
                user_id:'487568993',
                extended:1,
                fields:'start_date,members_count,verified,screen_name,activity',
                access_token:'bd474f163f4f2cee1a45d2a139f65c40b7a3be53f2375ac1ccb6477ac73f021f59093480b5a5880e4c17d'

            };
            var originalSig = '01cb459b116f7f9ab766cd30a0fed0f0';
            var mid = '487568993';
            var secret = 'c9cbcd80ee73a04e54';

            var lParams=[];
            _.each(params,(val,key)=>{
                lParams.push(`${key}=${val}`);
            });
            var sig = '/method/execute.groupsGet?'+lParams.join('&')+secret;
            console.log(sig);
            sig=md5(sig);
            console.log(
                md5(
                    `/method/execute.groupsGet?v=5.68&`+
                    `lang=ru&`+
                    `https=1&`+
                    `user_id=487568993`+
                    `&extended=1&`+
                    `fields=start_date,members_count,verified,screen_name,activity&`+
                    `access_token=bd474f163f4f2cee1a45d2a139f65c40b7a3be53f2375ac1ccb6477ac73f021f59093480b5a5880e4c17d`
                    +secret
                )
            );
               assert.equal(sig, originalSig, 'sig должно совпадать');
       // });
    });

});


