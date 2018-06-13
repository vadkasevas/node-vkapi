import {md5} from 'meteor/malibun23:stack';

VkClient = class VkClient extends HttpClient{
    constructor(url){
        super(url);
        this._getArr = [];
    }
    getUrl(){
        if(!this._url){
            if(_.isEmpty(this._getArr))
                return this.baseUrl;
            var urlData = HttpClient.urlParser.parse(this.baseUrl, true, true);
            urlData.search = '';
            _.each(this._getArr,(item)=>{
                urlData.query[item.key] = item.val;
            });
            this._url = HttpClient.urlParser.format(urlData);
        }
        return this._url;
    }

    withGetParam(key,val){
        var oldData = _.find(this._getArr,(item)=>{
            return item.key==key;
        });
        if(oldData){
            oldData.val = val;
        }else{
            this._getArr.push({key:key,val:val});
        }
        return this;
    };

    sig(method,secret){
        var right = _.chain(this._getArr)
            .map((item)=>{
                if(item.key=='sig')
                    return false;
                return `${item.key}=${item.val}`;
            }).filter((item)=>{
                return !!item;
            }).value().join('&');

        var sig = `/method/${method}?`+right+secret;
        var sig = md5( sig );
        return sig;
    }
}