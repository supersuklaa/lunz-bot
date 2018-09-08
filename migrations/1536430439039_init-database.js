exports.up = (pgm) => {
  pgm.createTable('favorites', {
    id: 'id',
    user_id: { type: 'integer', notNull: true },
    place: { type: 'string', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('favorites');
};
