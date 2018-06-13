
/**
 * Module dependencies.
 * @private
 */
const querystring          = require('querystring');
const cheerio              = require('cheerio');
const FormData             = require('form-data');
import {md5} from 'meteor/malibun23:stack';

/**
 * VkApi default options.
 * @type {Object}
 */
const defaultOptions = {
    /**
     * User access token to use.
     * @type {String}
     */
    accessToken: null,

    /**
     * VK API version to use.
     * @type {String}
     */
    apiVersion: '5.68',

    /**
     * VK application ID.
     * @type {Number}
     */
    appId: null,

    /**
     * VK application secret key.
     * @type {String}
     */
    appSecret: null,

    /**
     * Captcha service API key.
     * @type {String}
     */
    captchaApiKey: null,

    /**
     * Captcha service.
     * @type {String}
     *
     * Supported services:
     *   anti-captcha
     *   antigate
     *   rucaptcha
     */
    captchaService: 'anti-captcha',

    /**
     * User login.
     * @type {String}
     *
     * Can be an e-mail or a phone number.
     */
    userLogin: null,

    /**
     * User password.
     * @type {String}
     */
    userPassword: null,

    /**
     * Base delay between API calls.
     * @type {Number}
     *
     * 334 is ~1/3 of a second and it's used in an authorization via an user token.
     */
    baseDelay: 334
}

VkApi = class VkApi {
    /**
     * Constructor.
     * @param  {Object} options Options
     * @return {this}
     */
    constructor (options = {}) {
        /**
         * Options.
         * @type {Object}
         */
        this.options = Object.assign({}, defaultOptions, options);

        /**
         * CaptchaRecognizer instance.
         * @type {CaptchaRecognizer}
         */
        this.captchaRecognizer = this.options.captchaApiKey ? new CaptchaRecognizer(this.options.captchaService, this.options.captchaApiKey) : null;

        /**
         * Request delays.
         * @type {Array of Number}
         */
        this._delays = [
            0, // the latest request time
            0  // the latest delayed request time
        ];
    }

    fetchWithCookies(){
        return this.fetch.apply(this,arguments);
    }

    fetch(url,options){
        return new Promise((resolve,reject)=>{
            var client = HttpClient.forOptions({
                url:url,
                getParams:options.qs||null,
                headers:options.headers||null,
                httpMethod:options.method||HttpClient.METHOD_GET,
                postData:options.postData||null,
                context:this.options.context||null,
                timeout:options.timeout||60*1000,
                clientClass:options.sig?VkClient:HttpClient,
                files:options.files
            });

            if(options.body){
                client.withNpmRequestOptions({body:options.body});
            }

            if(options.formContentType){
                client.formContentType = options.formContentType;
            }



            if(options.formData){
                client.withNpmRequestOptions({formData:options.formData});
            }

            if(options.sig){
                client.withGetParam('sig', client.sig(options.vkMethod,this.options.secret) );
            }

            client.execute().then((err,content,client)=>{
                 if(err)
                     return reject(err);
                 var result = {
                     json(){
                         return new Promise((resolve,reject)=>{
                             if(content.data)
                                 return resolve(content.data);
                             return resolve(JSON.parse(content.content));
                         });
                     },
                     text(){
                         return new Promise((resolve,reject)=>{
                             return resolve(content.content);
                         });
                     }
                 }
                 resolve(result);
            });
        })
    }

    /**
     * Returns delay time.
     * @return  {Number} Delay in ms
     * @private
     */
    _getRequestDelayTime () {
        const dateNow = Date.now();
        let   delay   = 0;

        if ((dateNow - this._delays[0]) < this.options.baseDelay) {
            delay = this.options.baseDelay - (dateNow - this._delays[0]);

            if ((dateNow - this._delays[1]) <= 0) {
                delay = this._delays[1] - dateNow + this.options.baseDelay;
            }

            this._delays[1] = delay + dateNow;
        }

        return delay;
    }

    /**
     * Authorizes a user in the official application
     * of Vkontakte and returns an access token.
     * @param  {Object}
     *   @property {String} [client='android'] Official application (android, iphone)
     *   @property {String} login              User login
     *   @property {String} password           User password
     *   @property {String} [scope=MAX_SCOPE]  Permission scope [https://vk.com/dev/permissions]
     * @return {Promise => Object}
     * @public
     *
     * https://vk.com/dev/auth_direct
     */
    authorize ({ client = 'android', login = this.options.userLogin, password = this.options.userPassword, scope = constants.MAX_SCOPE } = {}) {
        const [ clientId, clientSecret ] = constants['CLIENT_' + client.toUpperCase()] || [];

        if (!clientId || !clientSecret) {
            return Promise.reject(new Error('"client" is unknown.'));
        }

        if (!login || !password) {
            return Promise.reject(new Error('Both "login" and "password" are required.'));
        }

        return this.fetch('https://oauth.vk.com/token', {
            qs: {
                client_id:     clientId,
                client_secret: clientSecret,
                grant_type:    'password',
                password:      password,
                scope:         scope,
                username:      login,
                v:             this.options.apiVersion
            }
        })
            .then(response => response.json())
            .then(response => {
                if (response.error) {
                    throw new VkAuthError(response);
                }

                this.options.accessToken = response.access_token;

                return response;
            });
    }

    /**
     * Calls VKontakte API methods.
     * @param  {String}         method Method name
     * @param  {Object}         params Method parameters
     * @return {Promise => Any}
     * @public
     */
    call (method, params = {}) {
        if (!method || typeof method !== 'string') {
            return Promise.reject(new Error('"method" must be a string.'));
        }

        this._delays[0] = Date.now();

        return new Promise(resolve => setTimeout(() => resolve(), this._getRequestDelayTime()))
            .then(() => this.fetch(`https://api.vk.com/method/${method}`, {
                sig:true,
                qs:Object.assign({
                    v:            this.options.apiVersion,
                    access_token: this.options.accessToken || ''
                }, params),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                method:  'POST',
                timeout: 5000,
                vkMethod:method
            }))
            .then(response => response.json())
            .then(response => {
                if (response.error) {
                    throw new VkApiError(response.error);
                }

                // Return full response object, because it
                // can contain "execute_errors" array which
                // is important when "execute" method is called.
                if (method === 'execute' || method.startsWith('execute.')) {
                    return response;
                }

                return response.response || response;
            })
            .catch(error => {
                // Captcha needed.
                if (error.name === 'VkApiError' && error.code === 14 && this.captchaRecognizer) {
                    return this.captchaRecognizer.recognize(error.captchaImg)
                        .then(result => {
                            params['captcha_sid'] = error.captchaSid;
                            params['captcha_key'] = result;

                            return this.call(method, params);
                        });
                }

                throw error;
            });
    }

    /**
     * Unstable authorization using user login and password.
     * @param  {Object}
     *   @property {Number} appId              Application ID
     *   @property {String} login              User login
     *   @property {String} password           User password
     *   @property {String} [scope=MAX_SCOPE]  Permission scope [https://vk.com/dev/permissions]
     * @return {Promise => Object}
     * @public
     *
     * https://vk.com/dev/implicit_flow_user
     */
    logIn ({ appId = this.options.appId, login = this.options.userLogin, password = this.options.userPassword, scope = constants.MAX_SCOPE } = {}) {
        if (!appId) {
            return Promise.reject(new Error('"appId" is required.'));
        }

        if (!login || !password) {
            return Promise.reject(new Error('Both "login" and "password" are required.'));
        }

        // Случай, когда пользователь получил токен ранее и
        // при переходе по URL, используемого при его получении,
        // новый токен выдаётся мгновенно (без авторизации),
        // недостижим, потому что при завершении работы
        // функции "logIn" все куки очищаются.
        //
        // Однако, возможен случай, когда сразу после авторизации
        // пользователь попадает на страницу с выданным токеном.

        return this.fetchWithCookies('https://oauth.vk.com/authorize', {
            qs: {
                client_id:     appId,
                display:       'mobile',
                redirect_uri:  'https://oauth.vk.com/blank.html',
                response_type: 'token',
                scope:         scope,
                v:             this.options.apiVersion
            }
        })
            .then(response => response.text())
            .then(body => {
                //console.log(body);
                const $ = cheerio.load(body);

                const loginForm  = $('form[method="post"]');
                const formFields = Object.create(null);

                loginForm.serializeArray().forEach(field => (formFields[field.name] = field.value));

                // Add "pass" and "email" fields to the login form.
                formFields['pass']  = password;
                formFields['email'] = login;

                return this.fetchWithCookies(loginForm.attr('action'), {
                    postData:formFields,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    method:  'POST'
                });
            })
            .then(response => {
                const hashIndex = response.url.indexOf('#');

                if (hashIndex !== -1) {
                    return querystring.parse(response.url.slice(hashIndex + 1));
                }

                if (response.url.includes('act=blocked')) {
                    throw new VkAuthError({
                        error:             'web_login_error',
                        error_description: 'Account is blocked.'
                    });
                }

                return response.text()
                    .then(body => {
                        const $          = cheerio.load(body);
                        const errorBlock = $('.service_msg_warning');

                        if (errorBlock.length) {
                            throw new VkAuthError({
                                error:             'web_login_error',
                                error_description: errorBlock.text()
                            });
                        }

                        const authForm = $('form[method="post"]');

                        if (!authForm.length) {
                            throw new VkAuthError({
                                error:             'web_login_error',
                                error_description: 'Failed to parse the auth form.'
                            });
                        }

                        return this.fetchWithCookies(authForm.attr('action'), {
                            method: 'POST'
                        });
                    })
                    .then(response => {
                        if (response.status !== 200) {
                            return response.json()
                                .then(json => {
                                    throw new VkAuthError(json);
                                });
                        }

                        return querystring.parse(response.url.slice(response.url.indexOf('#') + 1));
                    });
            })
            .then(response => {
                if (response.error) {
                    throw new VkAuthError(response);
                }

                if (response.access_token) {
                    this.options.accessToken = response.access_token;

                    response.expires_in = parseInt(response.expires_in);
                    response.user_id    = parseInt(response.user_id);

                    return response;
                }

                throw new VkAuthError({
                    error:             'web_login_error',
                    error_description: 'Unknown error.'
                });
            });
    }

    /**
     * Uploads files to vk.com.
     * @param  {String}  type              File type
     * @param  {Any}     files             File(s) to upload
     * @param  {Object}  params            Request params of the first step of uploading
     * @param  {Object}  afterUploadParams Request params of the second step of uploading
     * @return {Promise}
     * @public
     *
     * "files" can be a single file or an array of files.
     * Single file should be a FS Stream or an object that
     * contains these properties:
     *   content<Buffer> The file content
     *   name<String>    The file name
     */
    upload (type = '', files, params = {}, afterUploadParams = {}) {
        const [ fieldName, stepOneMethod, stepTwoMethod ] = constants['UFT_' + type.toUpperCase()] || [];
        if (!fieldName) {
            return Promise.reject(new Error('Unknown file type.'));
        }
        if (!files || (Array.isArray(files) && !files.length)) {
            return Promise.reject(new Error('No files to upload provided.'));
        }

        var mFiles = [];

        if (Array.isArray(files)) {
            // Only "photo_album" file type supports multiple files uploading.
            if (type !== 'photo_album') {
                return Promise.reject(new Error('Only "photo_album" file type can accept a few files.'));
            }

            // The maximum number of files is 5.
            if (files.length > 5) {
                return Promise.reject(new Error('Too many files to upload.'));
            }
            mFiles = _.map(files,(filePath,index)=>{
                return MultipartFile.fromFile(filePath,`file${index + 1}`);
            });
        } else {
            mFiles = [MultipartFile.fromFile(files,`file`)]
        }

        // Step 1: Get an upload URL.
        return this.call(stepOneMethod, params)
            .then(response =>{
                return response;
            })
            .then(response => this.fetch(response.upload_url, {
                files:mFiles, method: 'POST',timeout:30000,formContentType:HttpClient.FORM_MULTIPART
            }))
            .then(response => response.json())
            .then(response => {
                if (response.error) {
                    throw new VkUploadError(response);
                }

                if (stepTwoMethod) {
                    if (params.album_id) {
                        response.album_id = params.album_id;
                    }

                    if (params.group_id) {
                        response.group_id = params.group_id;
                    }

                    if (afterUploadParams) {
                        response = Object.assign(response, afterUploadParams);
                    }

                    // Step 2: Save the uploaded file.
                    return this.call(stepTwoMethod, response);
                }

                // "video" file type has no second step.
                return response;
            });
    }
}
VkApi.constants = constants;

