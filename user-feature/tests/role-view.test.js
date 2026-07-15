const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRoleViewData } = require('../controllers/role-view.helper');

test('buildRoleViewData returns the full report list for a system administrator', () => {
  const user = { _id: '507f191e810c19729de860ea' };
  const assignments = [{ idroles: { name: 'System Administrator' } }];
  const reports = [
    { _id: '1', subject: 'Issue A', userId: '507f191e810c19729de860ea' },
    { _id: '2', subject: 'Issue B', userId: '507f191e810c19729de860ea' },
  ];

  const payload = buildRoleViewData({ user, assignments, reports });

  assert.equal(payload.userid, '507f191e810c19729de860ea');
  assert.equal(payload.role, 'System Administrator');
  assert.equal(payload.report.length, 2);
  assert.equal(payload.report[0].subject, 'Issue A');
});

test('buildRoleViewData returns only the guest user report list for a guest', () => {
  const user = { _id: '507f191e810c19729de860eb' };
  const assignments = [{ idroles: { name: 'Guest' } }];
  const reports = [
    { _id: '3', subject: 'Guest report', userId: '507f191e810c19729de860eb' },
    { _id: '4', subject: 'Other report', userId: '507f191e810c19729de860ea' },
  ];

  const payload = buildRoleViewData({ user, assignments, reports });

  assert.equal(payload.userid, '507f191e810c19729de860eb');
  assert.equal(payload.role, 'Guest');
  assert.equal(payload.report.length, 1);
  assert.equal(payload.report[0].subject, 'Guest report');
});

test('buildRoleViewData keeps the guest payload scoped to the current user even when other reports exist', () => {
  const user = { _id: '507f191e810c19729de860eb' };
  const assignments = [{ idroles: { name: 'Guest' } }];
  const reports = [
    { _id: '5', subject: 'Guest own report', userId: '507f191e810c19729de860eb' },
    { _id: '6', subject: 'Another user report', userId: '507f191e810c19729de860ea' },
  ];

  const payload = buildRoleViewData({ user, assignments, reports });

  assert.equal(payload.report.length, 1);
  assert.equal(payload.report[0].subject, 'Guest own report');
});
