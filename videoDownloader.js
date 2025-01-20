const fs = require('fs');  
const path = require('path');  
const axios = require('axios');  

const downloadFile = async (url, fileName) => {  
    const filePath = path.join(__dirname, 'downloads', fileName);  

    try {  
        const response = await axios({  
            url,  
            method: 'GET',  
            responseType: 'stream',  
        });  

        return new Promise((resolve, reject) => {  
            response.data.pipe(fs.createWriteStream(filePath))  
                .on('finish', () => {  
                    resolve(filePath);  
                })  
                .on('error', (err) => {  
                    reject(err);  
                });  
        });  
    } catch (error) {  
        console.error('Error downloading file:', error);  
        throw error; // Ném lại lỗi để xử lý ở nơi gọi  
    }  
};  

module.exports = {  
    downloadFile,  
};  