import os
import tornado.httpserver
import tornado.ioloop
import tornado.web
import time
import base64

datastore = {"id": ""}
config = {}
with open("config.txt") as f:
  for line in f:
    opts = line.split("=")
    config[opts[0]] = opts[1].rstrip()

def require_basic_auth(handler_class):
    def wrap_execute(handler_execute):
        def require_basic_auth(handler, kwargs):
            auth_header = handler.request.headers.get('Authorization')
            if auth_header is None or not auth_header.startswith('Basic '):
                handler.set_status(401)
                handler.set_header('WWW-Authenticate', 'Basic realm=Restricted')
                handler._transforms = []
                handler.finish()
                return False
            auth_decoded = base64.decodestring(auth_header[6:])
            username, password = auth_decoded.split(':', 2)
            authenticated = username == config['user'] and config['pass'] == password
            kwargs['isAuthenticated'] = str(authenticated)
            if not authenticated:
                handler.set_status(401)
            return authenticated
        def _execute(self, transforms, *args, **kwargs):
            require_basic_auth(self, kwargs)
            return handler_execute(self, transforms, *args, **kwargs)
        return _execute

    handler_class._execute = wrap_execute(handler_class._execute)
    return handler_class

class ServerHandler(tornado.web.RequestHandler):
  def initialize(self, datastore):
    self.datastore = datastore

  def get(self):
    print(self.datastore)
    self.write(self.datastore["id"])

  def post(self):
    newId = self.get_argument("id", "No ID Received")
    self.datastore["id"] = newId
    self.write("Success")

class MyFileHandler(tornado.web.StaticFileHandler):
  def initialize(self, path):
    self.dirname, self.filename = os.path.split(path)
    super(MyFileHandler, self).initialize(self.dirname)

  def get(self, path=None, include_body=True):
    if isAuthenticated:
      super(MyFileHandler, self).get(self.filename, include_body)

class IndexHandler(tornado.web.RequestHandler):
  def initialize(self, datastore):
    self.datastore = datastore

  def get(self, **kwargs):
    self.render("index.html", idNum=self.datastore["id"])

@require_basic_auth
class MainHandler(tornado.web.RequestHandler):
  def get(self, isAuthenticated):
    if isAuthenticated:
      username = self.get_argument("user", None)
      password = self.get_argument("pass", None)
      self.render("main.html", username=username, password=password)

def main():
  application = tornado.web.Application(
      handlers = [
      (r'/', IndexHandler, dict(datastore = datastore)),
      (r'/main', MainHandler),
      (r"/server", ServerHandler, dict(datastore = datastore)),
      (r'/(.*)', tornado.web.StaticFileHandler, {'path': "./"}),
      ],
      template_path="./"
  )
  http_server = tornado.httpserver.HTTPServer(application)
  port = int(os.environ.get("PORT", 5000))
  http_server.listen(port)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  main()
