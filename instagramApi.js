const axios = require('axios');  

const instagramGetUrl = async (url_media) => {  
    try {  
        const response = await axios.get(url_media); // Lấy dữ liệu từ URL truyền vào  
        return response.data; // Trả về dữ liệu nhận được  
    } catch (error) {  
        throw new Error('Unable to fetch Instagram media details');  
    }  
};  

module.exports = instagramGetUrl;