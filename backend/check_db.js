require('dotenv').config();
const db = require('./models');
const { Op } = require('sequelize');

async function test() {
  try {
    const branchId = 1;
    const isAdmin = false;
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const batchWhere = {
      expiryDate: { 
        [Op.ne]: null,
        [Op.lte]: thirtyDaysLater 
      },
      quantity: { [Op.gt]: 0 },
    };
    if (!isAdmin && branchId) {
      batchWhere.branchId = { [Op.or]: [branchId, null] };
    }

    const expiringSoonCount = await db.ProductBatch.count({ where: batchWhere });
    console.log('QUERY expiringSoonCount:', expiringSoonCount);

    const expiringSoonItems = await db.ProductBatch.findAll({
      where: batchWhere,
      include: [
        { model: db.Product, as: 'product', attributes: ['name', 'image'] },
      ],
      limit: 5,
      order: [['expiryDate', 'ASC']]
    });
    console.log('QUERY expiringSoonItems Count:', expiringSoonItems.length);
    expiringSoonItems.forEach(i => {
      console.log(`- Item: ${i.product?.name}, Expiry: ${i.expiryDate}, Qty: ${i.quantity}, BranchId: ${i.branchId}`);
    });

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit();
  }
}

test();
