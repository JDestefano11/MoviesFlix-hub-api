const morgan = require("morgan")

const const logger = function (req, res, next) {
  console.log('logging')
  next()
}

app.use(logger)

app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.use(morgan('common'));


