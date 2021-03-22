/*  1. npm init
    2. npm i express --save
    3. npm i express-session --save
    4. npm i mysql --save
 */

// 웹서버 구축하는곳
const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');

app.use(
    session({
        secret: 'secret code', // session에 대한 key라고 생각(임의의 값 하고싶은거 하면됨)
        resve: false, // request 요청이 왔을 때 session에 수정사항이 생기지 않아도 session을 다시 저장할 것인지에 대한 설정
        saveUninitialized: false, // session에 저장에 저장할 내역이 없더라도 session을 항상 재저장을 할것인가?
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60, // 쿠키 유효 시간 1시간
        },
    }),
);

// request 요청할 때 body로 json형태의 parameter를 던질 수 있음(상세페이지 만들때 배움)
app.use(
    express.json({
        limit: '50mb',
    }),
);

// 웹서버 구현 (실행)
const server = app.listen(3000, () => {
    console.log('Server started. port 3000.');
});

// sql문을 만든 js파일
let sql = require('./sql.js');

fs.watchFile(__dirname + '/sql.js', (curr, prev) => {
    console.log('sql 변경시 재시작 없이 반영되도록 함');
    delete require.cache[require.resolve('./sql.js')];
    sql = require('./sql.js');
});

// mariaDB 정보
const db = {
    database: 'project',
    connectionLimit: 10,
    host: '192.168.50.30',
    user: 'root',
    password: '1234',
};

// createPool을 이용하여 위에 선언해준 db정보를 받고 DB와 연동이됨
const dbPool = require('mysql').createPool(db);

// 로그인 로직
app.post('/api/login', async (request, response) => {
    // request.session['email'] = 'jh2000lee@nate.com';
    // response.send('login OK');
    try {
        await req.db('signUp', request.body.param);
        console.log(request.body.param);
        if (request.body.param.length > 0) {
            for (let key in request.body.param[0]) {
                request.session[key] = request.body.param[0][key];
                response.send(request.body.param[0]);
            }
        } else {
            response.send({ error: 'Please try again or contact system manager.' });
        }
    } catch (e) {
        response.send({
            error: 'DB access error',
        });
    }
});

app.post('/api/logout', async (request, response) => {
    request.session.destroy();
    response.send('logout OK');
});

// 로그인, 로그아웃을 제외한것들을 불러올 때 (로그인이 필요한 화면)
app.post('/apirole/:alias', async (request, response) => {
    if (!request.session.email) {
        console.log(request);
        return response.status(401).send({ error: 'You need to login' });
    }
    try {
        console.log(response);
        response.send(await req.db(request.params.alias));
    } catch (err) {
        response.status(500).send({
            error: err,
        });
    }
});

// 로그인, 로그아웃을 제외한것들을 불러올 때 (로그인이 필요하지않은 화면)
app.post('/api/:alias', async (request, response) => {
    try {
        response.send(await req.db(request.params.alias, request.body.param));
    } catch (err) {
        response.status(500).send({
            error: err,
        });
    }
});

// 여기에 있는 req.db호출을 하는것
const req = {
    async db(alias, param = [], where = '') {
        return new Promise((resolve, reject) =>
            // 쿼리함수를 이용하여 db에서 data를 받아옴
            dbPool.query(sql[alias].query + where, param, (error, rows) => {
                if (error) {
                    if (error.code != 'ER_DUP_ENTRY') console.log(error);
                    reslove({
                        error,
                    });
                } else resolve(rows);
            }),
        );
    },
};
