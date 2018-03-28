const path = require('path');
const fs = require('fs');

module.exports = {
    getFileNameList(path) {
        let fileList = [];
        let dirList = fs.readdirSync(path);
        dirList.forEach(item => {
            if (item.indexOf('html') > -1) {
                fileList.push(item.split('.')[0]);
            }
        });
        return fileList;
    }
};