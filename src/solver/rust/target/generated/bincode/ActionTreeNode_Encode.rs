impl :: bincode :: Encode for ActionTreeNode
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        :: bincode :: Encode :: encode(&self.player, encoder) ?; :: bincode ::
        Encode :: encode(&self.board_state, encoder) ?; :: bincode :: Encode
        :: encode(&self.amount, encoder) ?; :: bincode :: Encode ::
        encode(&self.actions, encoder) ?; :: bincode :: Encode ::
        encode(&self.children, encoder) ?; Ok(())
    }
}