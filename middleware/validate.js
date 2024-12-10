const Joi = require("joi");

const validateStock = (req, res, next) => {
  const schema = Joi.object({
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    currentPrice: Joi.number().greater(0).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const schema = Joi.object({
    stockId: Joi.string().required(),
    type: Joi.string().valid("buy", "sell").required(),
    quantity: Joi.number().greater(0).required(),
    price: Joi.number().greater(0).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateStock, validateTransaction };
