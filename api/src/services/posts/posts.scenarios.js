export const standard = defineScenario({
  post: {
    one: {
      data: {
        title: 'String',
        user: { create: { email: 'String4989760', userId: 1 } },
      },
    },

    two: {
      data: {
        title: 'String',
        user: { create: { email: 'String7125259', userId: 1 } },
      },
    },
  },
})
