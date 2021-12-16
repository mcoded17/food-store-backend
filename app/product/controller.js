const fs = require('fs');
const path = require('path');

const Product = require('./model');
const config = require('../config');



async function store(req, res, next) {

    try {

        let payload = req.body;

        if (req.file) {

            // menangkap lokasi sementara file yang diupload:
            let tmp_path = req.file.path;

            // menangkap ekstensi dari file yang diupload
            let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];

            // membangun nama file baru lengkap dengan ekstensi asli
            let filename = req.file.filename + '.' + originalExt;

            let target_path = path.resolve(config.rootPath, `public/uploads/product/${filename}`);

            // (1) baca file yang masih di lokasi sementara 
            const src = fs.createReadStream(tmp_path);

            // (2) pindahkan file ke lokasi permanen
            const dest = fs.createWriteStream(target_path);

            // (3) mulai pindahkan file dari `src` ke `dest`
            src.pipe(dest);

            src.on('end', async () => {
                try {

                    let product = new Product({
                        ...payload,
                        image_url: filename
                    })
                    await product.save()
                    return res.json(product);

                } catch (err) {

                    // (1) jika error, hapus file yang sudah terupload pada direktori
                    fs.unlinkSync(target_path);

                    // (2) cek apakah error disebabkan validasi MongoDB
                    if (err && err.name === 'ValidationError') {
                        return res.json({
                            error: 1,
                            message: err.message,
                            fields: err.errors
                        })
                    }

                    next(err);

                }
            });

            src.on('error', async () => {
                next(err);
            });

        } else {

            let product = new Product(payload);
            await product.save();
            return res.json(product);

        }
    } catch (err) {

        // ----- cek tipe error ---- //
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }

        next(err);
    }
}

module.exports = {
    // index,
    store
}