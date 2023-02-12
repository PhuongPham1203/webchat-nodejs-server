var cors = require('cors')
let express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var shajs = require('sha.js')

let app = express();

// Start use cors
app.use(cors());
// End use cors

// Start connect DB
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

var dbConn = mysql.createConnection({
	host: 'sql9.freesqldatabase.com',
	user: 'sql9597386',
	password: 'iHlhCSNVXc',
	database: 'sql9597386',
	port: 3306,
});

dbConn.connect();
// End connect DB	

app.get("/", function (req, res) {
	return res.send("day la api server web chat box box lux");
});

// Start API
// start authentication
app.post("/signin", function (req, res) {

	let passEncodeSHA = shajs('sha256').update(req.body.password).digest('hex');
	dbConn.query('SELECT * FROM user_account where username = ? and password = ?', [req.body.username, passEncodeSHA], function (error, results, fields) {
		if (error) {
			return res.send({ error: true, data: results, message: error.message });
		}
		let returnData = null;

		if (results.length > 0) {
			let token = shajs('sha256').update(results[0].username + Date.now()).digest('hex');
			returnData = {
				id: results[0].id,
				username: results[0].username,
				name: results[0].name,
				privateKey: results[0].private_key,
				token: token,
				avataUrl: results[0].avata_url
			}

			// update token
			dbConn.query("UPDATE user_account SET token = ? WHERE username = ?", [token, results[0].username], function (error, results, fields) {
				//
			});
		}

		return res.send({ error: false, data: returnData, message: 'success' });
	});
});

app.post("/signintoken", function (req, res) {
	dbConn.query('SELECT * FROM user_account where token = ?', [req.body.token], function (error, results, fields) {
		if (error) {
			return res.send({ error: true, data: results, message: error.message });
		}
		let returnData = null;

		if (results.length > 0) {
			returnData = {
				id: results[0].id,
				username: results[0].username,
				name: results[0].name,
				privateKey: results[0].private_key,
				token: results[0].token,
				avataUrl: results[0].avata_url
			}
		}

		return res.send({ error: false, data: returnData, message: 'success' });
	});
});

app.post("/signup", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM user_account where username = ?', [req.body.username], function (error, results, fields) {

		let returnData = null;

		if (results.length > 0) {
			returnData = {
				usernameExit: true,
				createSuccess: false
			}
			return res.send({ error: false, data: returnData, message: 'success' });

		} else {
			let passEncodeSHA = shajs('sha256').update(req.body.password).digest('hex');
			let privateKeyEncodeSHA = shajs('sha256').update(req.body.username + Date.now()).digest('hex');
			dbConn.query('INSERT INTO user_account (name, username, password, private_key) VALUES (?,?,?,?)', [req.body.name, req.body.username, passEncodeSHA, privateKeyEncodeSHA], function (error2, results2, fields2) {
				if (error2) {
					return res.send({ error: true, data: results2, message: error2.message });
				}

				returnData = {
					usernameExit: false,
					createSuccess: true
				}

				return res.send({ error: false, data: returnData, message: 'success' });
			});
		}


	});

});
// end authentication 

// start friend
app.post("/findusername", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM user_account where username = ?', [req.body.username], function (error, results, fields) {

		let returnData = null;

		if (results.length > 0) {

			dbConn.query('SELECT * FROM room_id_friends where id_user_1 = ? and id_user_2 = ?', [req.body.id1 + "", results[0].id + ""], function (error2, results2, fields2) {

				if (!(results2.length > 0)) {
					returnData = {
						id: results[0].id,
						username: results[0].username,
						name: results[0].name,
						avataUrl: results[0].avata_url,
					}
				}
				return res.send({ error: false, data: returnData, message: 'success' });
			});

		} else {
			return res.send({ error: false, data: returnData, message: 'success' });
		}

	});

});

app.post("/finduserbyid", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM user_account where id = ?', [req.body.id1 + ""], function (error, results, fields) {

		let returnData = null;

		if (results.length > 0) {
			dbConn.query('SELECT * FROM room_id_friends where (id_user_1 = ? and id_user_2 = ?) or (id_user_2 = ? and id_user_1 = ?)', [req.body.id1 + "", req.body.id2 + "", req.body.id1 + "", req.body.id2 + ""], function (error2, results2, fields2) {
				if (results2.length > 0) {
					returnData = {
						id: results[0].id,
						username: results[0].username,
						name: results[0].name,
						avataUrl: results[0].avata_url,
						roomId: results2[0].room_id,
					}
				}
				return res.send({ error: false, data: returnData, message: 'success' });
			});

		} else {
			return res.send({ error: false, data: returnData, message: 'success' });
		}

	});

});

app.post("/sendrequestmakefriend", function (req, res) {

	// check sendrequestmakefriend exits 
	dbConn.query('SELECT * FROM room_id_friends where id_user_1 = ? and id_user_2 = ?', [req.body.id1 + "", req.body.id2 + ""], function (error, results, fields) {

		let returnData = null;

		if (results.length > 0) {
			returnData = {
				isSend: true,
			}
			return res.send({ error: false, data: returnData, message: 'success' });
		} else {
			// insert request
			let roomIdEncodeSHA = shajs('sha256').update(req.body.id1 + "" + req.body.id2 + "" + Date.now()).digest('hex');

			dbConn.query('INSERT INTO room_id_friends (id_user_1, id_user_2, is_accept_friend, room_id) VALUES (?,?,?,?)', [+req.body.id1, +req.body.id2, 0, roomIdEncodeSHA], function (error2, results2, fields2) {

				returnData = {
					isSend: true,
				}
				return res.send({ error: false, data: returnData, message: 'success' });

			});
		}

	});

});

app.post("/acceptrequestmakefriend", function (req, res) {

	// update request make friend
	dbConn.query("UPDATE room_id_friends SET is_accept_friend = ? WHERE id_user_1 = ? and id_user_2 = ?", ["1", req.body.id1 + "", req.body.id2 + ""], function (error, results, fields) {
		let returnData = {
			isAccept: true,
		}

		if (error) {
			return res.send({ error: true, data: results, message: error.message });
		} else {
			return res.send({ error: false, data: returnData, message: "success" });
		}
	});

});

app.post("/getlistfriend", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM room_id_friends where id_user_1 = ? or id_user_2 = ?', [req.body.id, req.body.id], function (error, results, fields) {

		let returnData = [];

		if (results.length > 0) {

			for (let i = 0; i < results.length; i++) {

				let friend = {
					userId1: results[i].id_user_1,
					userId2: results[i].id_user_2,
					isAcceptFriend: results[i].is_accept_friend,
				}
				returnData.push(friend);

			}
		}

		return res.send({ error: false, data: returnData, message: 'success' });

	});

});

app.post("/getlistchat", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM message_chat where (id_user_1 = ? and id_user_2 = ?) or (id_user_2 = ? and id_user_1 = ?) ORDER BY id DESC LIMIT 50', [req.body.id1, req.body.id2, req.body.id1, req.body.id2], function (error, results, fields) {

		let returnData = [];

		if (results.length > 0) {

			for (let i = results.length - 1; i >= 0; i--) {

				let mess = {
					userId1: results[i].id_user_1,
					userId2: results[i].id_user_2,
					message: results[i].message,
					timeCreate: results[i].datetime_create,
				}
				returnData.push(mess);

			}
		}

		return res.send({ error: false, data: returnData, message: 'success' });

	});

});

// end friend

// start common key 

app.post("/getpublickey", function (req, res) {

	// check username exits 
	dbConn.query('SELECT * FROM room_id_friends where (id_user_1 = ? and id_user_2 = ?) or (id_user_2 = ? and id_user_1 = ?)', [req.body.id1 + "", req.body.id2 + "", req.body.id1 + "", req.body.id2 + ""], function (error, results, fields) {

		let returnData = null;

		if (results.length > 0) {

			dbConn.query('SELECT * FROM user_account where id = ?', [req.body.id1 + ""], function (error2, results2, fields2) {
				if (results2.length > 0) {
					dbConn.query('SELECT * FROM user_account where id = ?', [req.body.id2 + ""], function (error3, results3, fields2) {
						if (results3.length > 0) {

							let key = results[0].room_id;
							if (+req.body.id1 < +req.body.id2) {
								key = key + results2[0].private_key;
							} else {
								key = results2[0].private_key + key;
							}

							returnData = {
								userId1: req.body.id1,
								userId2: req.body.id2,
								roomId: results[0].room_id,
								publicKey: key,
								//isAcceptFriend: results[i].is_accept_friend,
							}
							return res.send({ error: false, data: returnData, message: 'success' });
						}
					});
				}
			});


		}

		// return res.send({ error: false, data: returnData, message: 'success' });

	});

});

// start end key 


app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	console.error(err.message, err.stack);
	res.status(statusCode).json({ message: err.message });
	return;
});
// End API

// Start Socket
let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 3000;

io.on('connection', (socket) => {
	socket.on('join', (data) => {
		socket.join(data.room);
		socket.broadcast.to(data.room).emit('user joined');
		console.log("chat with : " + data.username + " in join room " + data.room);
	});

	socket.on('leave', function (room) {
		try {
			console.log('[socket]', 'leave room :', room);
			socket.leave(room);
			//socket.to(room).emit('user left', socket.id);
		} catch (e) {
			console.log('[error]', 'leave room :', e);
			socket.emit('error', 'couldnt perform requested action');
		}
	});


	socket.on('message', (data) => {
		//console.log("user " + data.userId1 + " send to " + data.userId2 + " with mess :" + data.message);
		//console.log("roomId " + data.roomId );
		saveMessage(data.userId1, data.userId2, data.message);
		io.in(data.roomId).emit('newMessage', { userId1: data.userId1, userId2: data.userId2, message: data.message, timeCreate: data.timeCreate, roomId: data.roomId });
	});
});

function saveMessage(id1, id2, message) {
	dbConn.query('INSERT INTO message_chat (id_user_1, id_user_2, message) VALUES (?,?,?)', [id1, id2, message], function (error, results, fields) {
		//
	});
}

// End Socket

// run listen port
server.listen(port, () => {
	console.log(`started on port: ${port}`);
});
