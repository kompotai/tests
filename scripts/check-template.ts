import { MongoClient } from 'mongodb';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('ws_megatest');

  const template = await db.collection('agreementtemplates')
    .findOne({}, { sort: { createdAt: -1 } });

  if (template) {
    console.log('Template ID:', template._id.toString());
    console.log('Name:', template.name);
    console.log('Fields count:', template.fields?.length || 0);
    console.log('Roles count:', template.roles?.length || 0);

    const byPage: Record<number, any[]> = {};
    for (const f of template.fields || []) {
      if (!byPage[f.pageNumber]) byPage[f.pageNumber] = [];
      byPage[f.pageNumber].push(f);
    }

    for (const [page, fields] of Object.entries(byPage)) {
      console.log(`\n=== Page ${page} ===`);
      for (const f of fields) {
        let extra = '';
        if (f.defaultValue) extra += `, default="${f.defaultValue}"`;
        if (f.signatureData) extra += `, hasSignature=true`;
        console.log(`  ${f.type}: x=${Math.round(f.x)}, y=${Math.round(f.y)}, w=${f.width}, h=${f.height}${extra}`);
      }
    }

    console.log('\nRoles:');
    for (const r of template.roles || []) {
      console.log(`  ${r.name} (order: ${r.routingOrder})`);
    }

    console.log('\nURL: http://localhost:3000/ws/agreements/templates/' + template._id.toString() + '/edit');
  } else {
    console.log('No templates found');
  }

  await client.close();
}

main().catch(console.error);
