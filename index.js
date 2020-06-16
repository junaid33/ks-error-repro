import 'dotenv/config';
import { Keystone } from '@keystonejs/keystone';
import { PasswordAuthStrategy } from '@keystonejs/auth-password';
import {
  Text,
  Integer,
  Relationship,
  DateTime,
  Select,
  Float,
  Password,
  Checkbox,
} from '@keystonejs/fields';

import { GraphQLApp } from '@keystonejs/app-graphql';
import { AdminUIApp } from '@keystonejs/app-admin-ui';
import { KnexAdapter } from '@keystonejs/adapter-knex';

const knexOptions = {
  client: 'postgres',
  connection: process.env.DATABASE_URL,
  dropDatabase: true,
};

const keystone = new Keystone({
  name: 'Keystone App',
  adapter: new KnexAdapter({ knexOptions }),
});

function userIsAdmin({ authentication: { item: user } }) {
  return Boolean(user && user.isAdmin);
}

function userOwnsItem({ authentication: { item: user } }) {
  if (!user) {
    return false;
  }
  // This returns a graphql Where object, not a boolean
  return { user: { id: user.id } };
}

// This will check if the current user is requesting information about themselves
function userIsUser({ authentication: { item: user } }) {
  // here we return either false if there is no user, or a graphql where clause
  return user && { id: user.id };
}

function userIsAdminOrOwner(auth) {
  const isAdmin = userIsAdmin(auth);
  const isOwner = userOwnsItem(auth);
  return isAdmin || isOwner;
}

function userCanAccessUsers(auth) {
  const isAdmin = userIsAdmin(auth);
  const isThemselves = userIsUser(auth);
  return isAdmin || isThemselves;
}

const User = {
  access: {
    create: true,
    read: userCanAccessUsers,
    update: userCanAccessUsers,
    delete: userIsAdmin,
  },
  fields: {
    name: { type: Text },
    email: {
      type: Text,
      isUnique: true,
      // access: { read: userIsAdminOrOwner },
    },
    password: { type: Password, isRequired: true },
    isAdmin: { type: Checkbox },
  },
};

const Shop = {
  labelResolver: item => item.name,
  fields: {
    name: { type: Text },
    user: {
      type: Relationship,
      ref: 'User',
      many: false,
    },
    shopItems: { type: Relationship, ref: 'ShopItem.shop', many: true },
  },
  access: {
    create: Boolean(userIsAdminOrOwner),
    read: userIsAdminOrOwner,
    update: userIsAdminOrOwner,
    delete: userIsAdminOrOwner,
  },
};

const ShopItem = {
  labelResolver: item => item.pId,
  fields: {
    pId: { type: Text },
    vId: { type: Text },
    quantity: { type: Float },
    shop: {
      type: Relationship,
      ref: 'Shop.shopItems',
      many: false,
    },
  },
  access: {
    create: Boolean(userIsAdminOrOwner),
    read: userIsAdminOrOwner,
    update: userIsAdminOrOwner,
    delete: userIsAdminOrOwner,
  },
};

const Channel = {
  labelResolver: item => item.name,
  fields: {
    settings: { type: Text },
    name: { type: Text },

    user: {
      type: Relationship,
      ref: 'User',
      many: false,
    },
    channelItems: {
      type: Relationship,
      ref: 'ChannelItem.channel',
      many: true,
    },
  },
  access: {
    create: Boolean(userIsAdminOrOwner),
    read: userIsAdminOrOwner,
    update: userIsAdminOrOwner,
    delete: userIsAdminOrOwner,
  },
};

const ChannelItem = {
  labelResolver: item => item.pId,
  fields: {
    pId: { type: Text },
    vId: { type: Text },
    quantity: { type: Float },
    channel: {
      type: Relationship,
      ref: 'Channel.channelItems',
      many: false,
    },
  },
  access: {
    create: Boolean(userIsAdminOrOwner),
    read: userIsAdminOrOwner,
    update: userIsAdminOrOwner,
    delete: userIsAdminOrOwner,
  },
};

const Match = {
  label: 'Match',
  fields: {
    input: {
      type: Relationship,
      ref: 'ShopItem',
      many: true,
    },
    output: {
      type: Relationship,
      ref: 'ChannelItem',
      many: true,
    },
    user: {
      type: Relationship,
      ref: 'User',
      many: false,
    },
  },
  access: {
    create: Boolean(userIsAdminOrOwner),
    read: userIsAdminOrOwner,
    update: userIsAdminOrOwner,
    delete: userIsAdminOrOwner,
  },
};

keystone.createList('User', User);

keystone.createList('Shop', Shop);
keystone.createList('ShopItem', ShopItem);

keystone.createList('Channel', Channel);
keystone.createList('ChannelItem', ChannelItem);

keystone.createList('Match', Match);

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});

const adminApp = new AdminUIApp({
  adminPath: '/admin',
  authStrategy,
});

module.exports = {
  keystone,
  apps: [new GraphQLApp(), adminApp],
};
