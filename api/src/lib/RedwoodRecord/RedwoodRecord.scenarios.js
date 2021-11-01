export const standard = defineScenario({
  user: {
    rob: {
      data: {
        email: 'rob@redwoodjs.com',
        name: 'Rob Cameron',
      },
    },
    tom: {
      data: {
        email: 'tom@redwoodjs.com',
        name: 'Tom Preston-Werner',
      },
    },
  },
  post: {
    first: (scenario) => ({
      data: {
        userId: scenario.user.rob.id,
        title: 'First post',
      },
    }),
  },
})
