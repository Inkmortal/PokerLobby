impl :: bincode :: Encode for BetSizeOptions
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        :: bincode :: Encode :: encode(&self.bet, encoder) ?; :: bincode ::
        Encode :: encode(&self.raise, encoder) ?; Ok(())
    }
}