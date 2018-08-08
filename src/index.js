const app = require('./app');
const PORT = 3000;

app().then((server) =>
	server.listen(PORT, () => console.log('kcilC app listening on port 3000'))
);
