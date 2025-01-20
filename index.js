const express = require('express');  
const path = require('path');  
const fs = require('fs');  
const getFbVideoInfo = require('./fb-downloader-scrapper/src/index.js');  
const instagramGetUrl = require('./instagram-url-direct/src/index.js');  
const { downloadFile } = require('./videoDownloader');  

const app = express();  
const PORT = process.env.PORT || 3001;  

app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
app.use(express.static(path.join(__dirname, 'public')));  

// Endpoint để tải video từ Facebook  
app.post('/download/facebook', async (req, res) => {  
    const { videoUrl, cookie, useragent } = req.body;  
    try {  
        const videoInfo = await getFbVideoInfo(videoUrl, cookie, useragent);  
        
        const localPath = await downloadFile(videoInfo.hd, `video-${Date.now()}.mp4`);  
        const filename = path.basename(localPath);  

        res.send(`  
            <!DOCTYPE html>  
            <html lang="en">  
            <head>  
                <meta charset="UTF-8">  
                <meta name="viewport" content="width=device-width, initial-scale=1.0">  
                <title>${videoInfo.title}</title>  
                <style>  
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: auto; background-color: #e0f7fa; color: #333; padding: 20px; }  
                    h1 { color: #00796b; text-align: center; }  
                    .video-container { text-align: center; margin-top: 20px; border: 1px solid #00796b; border-radius: 8px; padding: 10px; background: white; }  
                    video { width: 100%; height: auto; border-radius: 8px; }  
                    a { display: inline-block; margin-top: 10px; padding: 10px 15px; background: #00796b; color: white; text-decoration: none; border-radius: 5px; transition: background 0.3s; }  
                    a:hover { background: #004d40; }  
                </style>  
            </head>  
            <body>  
                <h1>${videoInfo.title}</h1>  
                <div class="video-container">  
                    <video controls>  
                        <source src="/downloads/${filename}" type="video/mp4">  
                        Your browser does not support the video tag.  
                    </video>  
                    <br>  
                    <a href="/downloads/${filename}" download>Download HD Video</a>  
                </div>  
            </body>  
            </html>  
        `);  
    } catch (error) {  
        console.error(error);  
        res.status(400).json({ error: error.message || "Unable to fetch video information" });  
    }  
});  

// Endpoint để tải video hoặc ảnh từ Instagram  
app.post('/download/instagram', async (req, res) => {  
    const { url_media } = req.body;  
    try {  
        const mediaInfo = await instagramGetUrl(url_media);  

        let htmlContent = `  
            <!DOCTYPE html>  
            <html lang="en">  
            <head>  
                <meta charset="UTF-8">  
                <meta name="viewport" content="width=device-width, initial-scale=1.0">  
                <title>Instagram Media Download</title>  
                <style>  
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: auto; background-color: #e0f7fa; color: #333; padding: 20px; }  
                    h1, h2, h3 { color: #00796b; }  
                    .media-container { margin-bottom: 20px; border: 1px solid #00796b; border-radius: 8px; padding: 10px; background: white; }  
                    img { max-width: 100%; height: auto; border-radius: 8px; }  
                    video { width: 100%; height: auto; border-radius: 8px; }  
                    a { display: inline-block; margin-top: 10px; padding: 10px 15px; background: #00796b; color: white; text-decoration: none; border-radius: 5px; transition: background 0.3s; }  
                    a:hover { background: #004d40; }  
                </style>  
            </head>  
            <body>  
                <h1>${mediaInfo.post_info.owner_fullname}'s Media</h1>  
                <h2>Caption:</h2>  
                <p>${mediaInfo.post_info.caption}</p>  
                <h2>Media:</h2>  
        `;  

        // Hiển thị video nếu có  
        if (mediaInfo.media_details.some(media => media.type === 'video')) {  
            htmlContent += `<h3>Videos:</h3>`;  
            const videoPromises = mediaInfo.url_list.map(async (url, index) => {  
                const fileName = `video-${Date.now()}-${index}.mp4`; // Thêm chỉ số vào tên file  
                await downloadFile(url, fileName);  

                // Thêm video vào trang HTML  
                htmlContent += `  
                    <div class="media-container">  
                        <video controls>  
                            <source src="/downloads/${fileName}" type="video/mp4">  
                            Your browser does not support the video tag.  
                        </video>  
                        <br />  
                        <a href="/downloads/${fileName}" download>Download Video</a>  
                    </div>  
                `;  
            });  
            await Promise.all(videoPromises);  
        }  

        // Hiển thị ảnh nếu có  
        if (mediaInfo.media_details.some(media => media.type === 'image')) {  
            htmlContent += `<h3>Images:</h3>`;  
            const imagePromises = mediaInfo.url_list.map(async (url, index) => {  
                const fileName = `image-${Date.now()}-${index}.jpg`; // Thêm chỉ số vào tên file  
                await downloadFile(url, fileName);  

                // Thêm ảnh vào trang HTML  
                htmlContent += `  
                    <div class="media-container">  
                        <img src="/downloads/${fileName}" alt="Instagram Image">  
                        <br />  
                        <a href="/downloads/${fileName}" download>Download Image</a>  
                    </div>  
                `;  
            });  
            await Promise.all(imagePromises);  
        }  

        htmlContent += `  
                </body>  
                </html>  
        `;  

        res.send(htmlContent);   
    } catch (error) {  
        console.error(error);  
        res.status(400).json({ error: error.message || "Unable to fetch media information" });  
    }  
});  

// Route tải video đã tải về  
app.get('/downloads/:filename', (req, res) => {  
    const filePath = path.join(__dirname, 'downloads', req.params.filename);  
    res.download(filePath, (err) => {  
        if (err) {  
            res.status(404).send('File not found');  
        }  
    });  
});  

// Chạy server  
app.listen(PORT, () => {  
    console.log(`Server is running on http://localhost:${PORT}`);  
});