// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};
export const identity = value => value;
export const createBasicRecord = (pub, parent = null) => ({
  child: null,
  isShown: parent ? parent.public.isOpen && parent.isShown : true,
  parent,
  public: pub,
  sibling: null,
  visited: false
});
export const getIdByIndex = (index, {
  getRecordData
}) => {
  const {
    data: {
      id
    }
  } = getRecordData(index);
  return id;
};