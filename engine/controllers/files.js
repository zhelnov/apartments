var AP = require('./../classes/AP');

exports.upload = function(req, res) {
	if(req.files){
    console.log(req.files);
    res.end("File uploaded.");
  }
};