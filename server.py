import os
import tornado.httpserver
import tornado.ioloop
import tornado.web
import time

datastore = {"id": ""}

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
    # Ignore 'path'.
    super(MyFileHandler, self).get(self.filename, include_body)

class IndexHandler(tornado.web.RequestHandler):
  def initialize(self, datastore):
    self.datastore = datastore

  def get(self):
    self.render("index.html", idNum=self.datastore["id"])


def main():
  application = tornado.web.Application(
      handlers = [
      (r'/', IndexHandler, dict(datastore = datastore)),
      (r'/main', MyFileHandler, {'path': "./main.html"}),
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
