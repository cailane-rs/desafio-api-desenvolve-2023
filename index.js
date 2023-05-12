const http = require('http');
const { constants } = require('http2');

const tasks = [
  { id: 1, description: 'Comprar leite', status: 'pendente' },
  { id: 2, description: 'Pagar conta de luz', status: 'concluída' },
];

const ENDPOINT = '/tasks'

const HTTP_STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  NOT_FOUND: 404,
};

function handleRequestBody(data, id, type) {
  const body = JSON.parse(data);
  const task = { id, ...body};
  if (type === "newTask") { tasks.push(task); }
  tasks[id - 1] = task;
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  res.setHeader('Content-Type', 'application/json');

  if (method === constants.HTTP2_METHOD_GET && url === ENDPOINT) {
    res.statusCode = HTTP_STATUS_CODE.OK;
    res.end(JSON.stringify(tasks));
  }

  if (method === constants.HTTP2_METHOD_POST && url === ENDPOINT) {
    const id = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;

    req.on('data', (data) => {
      handleRequestBody(data, id, "task");
    })
      .on('end', () => {
        res.statusCode = HTTP_STATUS_CODE.CREATED;
        return res.end(JSON.stringify(tasks));
      });
  }

  if (method === constants.HTTP2_METHOD_PUT && new RegExp(`^${ENDPOINT}/\\d+$`).test(url)) {
    const id = parseInt(url.split('/').pop());

    req.on('data', (data) => {
      handleRequestBody(data, id, 'update');
    })
      .on('end', () => {
        return res.end(JSON.stringify(tasks));
      });
  }

  if (method === constants.HTTP2_METHOD_DELETE && new RegExp(`^${ENDPOINT}/\\d+$`).test(url)) {
    const indexOfId = (parseInt(url.split('/').pop())) - 1;
    tasks.splice(indexOfId, 1);

    req.on('end', () => {
      return res.end(JSON.stringify(tasks));
    });
  }

  res.statusCode = HTTP_STATUS_CODE.NOT_FOUND;
  res.end();
  return;
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});